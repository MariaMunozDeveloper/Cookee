'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const https = require('https');
const cloudinary = require('../config/cloudinary');

const Publication = require('../models/publication.model');

const UNSPLASH_KEY = 'Ylj0ruAOyniI2M5FWx901YomX8WWQ1haXlb65WNSVWY';

// queries por defecto para cada paso según el número
const stepQueries = [
    'food preparation cutting ingredients',
    'cooking pan stove kitchen',
    'mixing bowl baking ingredients',
    'cooking pot simmering',
    'food plating presentation',
    'cooking process kitchen',
    'baking oven food',
    'food garnish finishing'
];

function getStepQuery(title, stepIndex) {
    // usamos el título de la receta + una query genérica del paso
    const base = title.split(' ').slice(0, 2).join(' ');
    const fallback = stepQueries[stepIndex % stepQueries.length];
    return `${base} ${fallback}`;
}

async function downloadAndUpload(query) {
    return new Promise((resolve) => {
        const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_KEY}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const json = JSON.parse(data);
                    const imageUrl = json.urls?.regular;

                    if (!imageUrl) {
                        console.log(`  Sin imagen para: ${query}`);
                        resolve(null);
                        return;
                    }

                    const imageBuffer = await new Promise((res, rej) => {
                        https.get(imageUrl, (imgRes) => {
                            const chunks = [];
                            imgRes.on('data', chunk => chunks.push(chunk));
                            imgRes.on('end', () => res(Buffer.concat(chunks)));
                            imgRes.on('error', rej);
                        }).on('error', rej);
                    });

                    const resultado = await new Promise((res, rej) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { folder: 'cookee/publications' },
                            (error, result) => {
                                if (error) rej(error);
                                else res(result);
                            }
                        );
                        stream.end(imageBuffer);
                    });

                    resolve(resultado.secure_url);

                } catch (e) {
                    console.log(`  Error: ${e.message}`);
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedStepImages() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado\n');

        const publications = await Publication.find({});
        console.log(`Encontradas ${publications.length} publicaciones\n`);

        let totalRequests = 0;
        let totalUpdated = 0;

        for (const pub of publications) {
            const stepsWithoutImage = pub.steps.filter(s => !s.image);

            if (stepsWithoutImage.length === 0) {
                console.log(`✓ "${pub.title}" — todos los pasos ya tienen imagen`);
                continue;
            }

            console.log(`→ "${pub.title}" — ${stepsWithoutImage.length} pasos sin imagen`);

            let modified = false;

            for (let i = 0; i < pub.steps.length; i++) {
                const step = pub.steps[i];

                if (step.image) {
                    console.log(`  Paso ${i + 1}: ya tiene imagen, saltando`);
                    continue;
                }

                // pausa entre requests para no saturar unsplash
                if (totalRequests > 0) {
                    await sleep(1300); // ~45 requests/min para no pasarnos de 50/hora
                }

                const query = getStepQuery(pub.title, i);
                console.log(`  Paso ${i + 1}: descargando imagen (${query})...`);

                const url = await downloadAndUpload(query);
                totalRequests++;

                if (url) {
                    pub.steps[i].image = url;
                    modified = true;
                    console.log(`  Paso ${i + 1}: ✓ imagen subida`);
                } else {
                    console.log(`  Paso ${i + 1}: ✗ no se pudo obtener imagen`);
                }
            }

            if (modified) {
                pub.markModified('steps');
                await pub.save();
                totalUpdated++;
                console.log(`  Guardado ✓\n`);
            }
        }

        console.log('\n✅ Script completado');
        console.log(`   Publicaciones actualizadas: ${totalUpdated}`);
        console.log(`   Requests a Unsplash: ${totalRequests}`);

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedStepImages();
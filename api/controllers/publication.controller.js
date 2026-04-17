'use strict';

const Publication = require('../models/publication.model');
const Follow = require('../models/follow.model');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const publicationController = {};

publicationController.save = async (req, res) => {
    try {
        const params = req.body;

        //comprobamos que tenga titulo
        if (!params.title || !params.title.trim()) {
            return res.status(400).json({
                status: false,
                message: 'La receta debe tener un título'
            });
        }

        const ingredients = Array.isArray(params.ingredients) ? params.ingredients : [];
        const steps = Array.isArray(params.steps) ? params.steps : [];
        const images = Array.isArray(params.images) ? params.images : [];
        const hashtags = Array.isArray(params.hashtags) ? params.hashtags : [];

        for (let ingredient of ingredients) {
            if (!ingredient.name || !ingredient.name.trim()) {
                return res.status(400).json({
                    status: false,
                    message: 'Todos los ingredientes deben tener nombre'
                });
            }
        }

        for (let step of steps) {
            if (!step.text || !step.text.trim()) {
                return res.status(400).json({
                    status: false,
                    message: 'Todos los pasos deben tener texto'
                });
            }
        }

        const publication = new Publication({
            user: req.user.sub,
            title: params.title,
            text: params.text || '',
            description: params.description || '',
            recommendations: params.recommendations || '',
            ingredients,
            steps,
            images,
            hashtags,
            tiempoHorno: params.tiempoHorno || null,
            temperaturaHorno: params.temperaturaHorno || null,
            raciones: params.raciones || null
        });

        const publicationStored = await publication.save();

        return res.status(200).json({
            status: true,
            message: 'Receta guardada correctamente',
            publication: publicationStored
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.feed = async (req, res) => {
    try {
        const userId = req.user.sub;
        const page = Math.max(parseInt(req.params.page) || 1, 1);
        const limit = 10;

        const followInfo = await followUserIds(userId);
        const usersToShow = [...followInfo.following, userId];

        const options = {
            page,
            limit,
            sort: { createdAt: -1 },
            populate: { path: 'user', select: '-password' }
        };

        const result = await Publication.paginate(
            { user: { $in: usersToShow } },
            options
        );

        return res.status(200).json({
            status: true,
            publications: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.getPublicationById = async (req, res) => {
    try {
        const publicationId = req.params.id;

        // sumamos una vista cada vez que alguien abre la receta
       const publication = await Publication.findByIdAndUpdate(
           publicationId,
           { $inc: { views: 1 } },
           { returnDocument: 'after' }
       ).populate('user', '-password');

        if (!publication) {
            return res.status(404).json({
                status: false,
                message: 'La receta no existe'
            });
        }

        return res.status(200).json({ status: true, publication });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.remove = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const userId = req.user.sub;

        const publicationDeleted = await Publication.findOneAndDelete({
            _id: publicationId,
            user: userId
        });

        if (!publicationDeleted) {
            return res.status(404).json({
                status: false,
                message: 'No se ha encontrado la receta o no tienes permiso para borrarla'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Receta eliminada correctamente'
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.upload = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const userId = req.user.sub;

        if (!req.file) {
            return res.status(400).json({ status: false, message: 'No se ha subido ninguna imagen' });
        }

        const publication = await Publication.findOne({ _id: publicationId, user: userId });

        if (!publication) {
            return res.status(404).json({ status: false, message: 'Receta no encontrada o sin permiso' });
        }

        const resultado = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'cookee/publications' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        publication.images.push(resultado.secure_url);
        await publication.save();

        return res.status(200).json({
            status: true,
            message: 'Imagen subida correctamente',
            file: resultado.secure_url,
            publication
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.uploadStepImage = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const stepIndex = parseInt(req.params.stepIndex);
        const userId = req.user.sub;

        if (!req.file) {
            return res.status(400).json({ status: false, message: 'No se ha subido ninguna imagen' });
        }

        const publication = await Publication.findOne({ _id: publicationId, user: userId });

        if (!publication) {
            return res.status(404).json({ status: false, message: 'Receta no encontrada o sin permiso' });
        }

        const resultado = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'cookee/publications' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        if (publication.steps[stepIndex]) {
            publication.steps[stepIndex].image = resultado.secure_url;
            publication.markModified('steps');
            await publication.save();
        }

        return res.status(200).json({
            status: true,
            message: 'Imagen del paso subida correctamente',
            file: resultado.secure_url,
            publication
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.getByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const page = Math.max(parseInt(req.params.page) || 1, 1);
        const limit = 12;

        const options = {
            page,
            limit,
            sort: { createdAt: -1 },
            populate: { path: 'user', select: '-password' }
        };

        const result = await Publication.paginate({ user: userId }, options);

        return res.status(200).json({
            status: true,
            publications: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.update = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const userId = req.user.sub;
        const params = req.body;

        const publication = await Publication.findOne({ _id: publicationId, user: userId });

        if (!publication) {
            return res.status(404).json({
                status: false,
                message: 'Receta no encontrada o sin permiso'
            });
        }

        if (params.title) publication.title = params.title;
        if (params.description !== undefined) publication.description = params.description;
        if (params.text !== undefined) publication.text = params.text;
        if (params.recommendations !== undefined) publication.recommendations = params.recommendations;
        if (params.raciones !== undefined) publication.raciones = params.raciones;
        if (params.tiempoHorno !== undefined) publication.tiempoHorno = params.tiempoHorno;
        if (params.temperaturaHorno !== undefined) publication.temperaturaHorno = params.temperaturaHorno;
        if (params.hashtags) publication.hashtags = params.hashtags;
        if (params.ingredients) publication.ingredients = params.ingredients;
        if (params.steps) {
            publication.steps = params.steps;
            publication.markModified('steps');
        }
        if (params.images) {publication.images = params.images;
        }

        await publication.save();

        return res.status(200).json({
            status: true,
            message: 'Receta actualizada correctamente',
            publication
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.explore = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 12;
        const sort = req.query.sort || 'recent';
        const hashtag = req.query.hashtag || '';

        const filtro = hashtag ? { hashtags: hashtag.toLowerCase() } : {};

        let sortOption = {};
        if (sort === 'likes') sortOption = { likes: -1 };
        else if (sort === 'views') sortOption = { views: -1 };
        else sortOption = { createdAt: -1 };

        const options = {
            page,
            limit,
            sort: sortOption,
            populate: { path: 'user', select: '-password' }
        };

        const result = await Publication.paginate(filtro, options);

        return res.status(200).json({
            status: true,
            publications: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.toggleLike = async (req, res) => {
    try {
        const publicationId = req.params.id;
        const userId = req.user.sub;

        const publication = await Publication.findById(publicationId);

        if (!publication) {
            return res.status(404).json({ status: false, message: 'Receta no encontrada' });
        }

        const yaLeDioLike = publication.likes.some(id => id.toString() === userId);

        if (yaLeDioLike) {
            publication.likes = publication.likes.filter(id => id.toString() !== userId);
        } else {
            publication.likes.push(userId);
        }

        await publication.save();

        return res.status(200).json({
            status: true,
            likes: publication.likes.length,
            hasLike: !yaLeDioLike
        });

    } catch (error) {
         console.error('Error toggleLike:', error.message);
            return res.status(500).json({ status: false, message: error.message });
    }
};

publicationController.getCounters = async (req, res) => {
    try {
        let userId = req.user.sub;
        if (req.params.id) userId = req.params.id;

        const total = await Publication.countDocuments({ user: userId });

        return res.status(200).json({ status: true, userId, total });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

async function followUserIds(userId) {
    const following = await Follow.find({ user: userId }).select({ followed: 1, _id: 0 });
    return {
        following: following.map(follow => follow.followed.toString())
    };
}

module.exports = publicationController;
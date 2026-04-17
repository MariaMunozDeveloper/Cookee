'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const User = require('../models/user.model');
const Publication = require('../models/publication.model');
const Follow = require('../models/follow.model');
const Comment = require('../models/comment.model');

// pon aqui tu access key de unsplash
const UNSPLASH_KEY = 'Ylj0ruAOyniI2M5FWx901YomX8WWQ1haXlb65WNSVWY';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cookee';

// usuarios de prueba
const usuariosSeed = [
  { name: 'Laura', surname: 'García', nick: 'lauracocina', email: 'laura@cookee.com' },
  { name: 'Carlos', surname: 'Martínez', nick: 'carloskitchen', email: 'carlos@cookee.com' },
  { name: 'Ana', surname: 'López', nick: 'anaverde', email: 'ana@cookee.com' },
  { name: 'Pedro', surname: 'Sánchez', nick: 'pedroasador', email: 'pedro@cookee.com' },
  { name: 'María', surname: 'Fernández', nick: 'mariapastelera', email: 'maria@cookee.com' },
  { name: 'Javi', surname: 'Ruiz', nick: 'javifusion', email: 'javi@cookee.com' },
  { name: 'Sofía', surname: 'Torres', nick: 'sofiasana', email: 'sofia@cookee.com' },
  { name: 'Miguel', surname: 'Romero', nick: 'migueltradicional', email: 'miguel@cookee.com' },
  { name: 'Elena', surname: 'Moreno', nick: 'elenavegetariana', email: 'elena@cookee.com' },
  { name: 'Rubén', surname: 'Jiménez', nick: 'rubenbbq', email: 'ruben@cookee.com' },
  { name: 'Lucía', surname: 'Navarro', nick: 'luciarepostera', email: 'lucia@cookee.com' },
  { name: 'Andrés', surname: 'Díaz', nick: 'andrespescados', email: 'andres@cookee.com' },
  { name: 'Carmen', surname: 'Pérez', nick: 'carmenmediterrania', email: 'carmen@cookee.com' }
];

// recetas de prueba
const recetasSeed = [
  {
    title: 'Tarta de queso al horno',
    description: 'La tarta de queso perfecta, cremosa por dentro y dorada por fuera.',
    text: 'Esta receta me la enseñó mi abuela y nunca falla. El truco está en no abrir el horno.',
    hashtags: ['tarta', 'queso', 'postre', 'horno'],
    raciones: 8, tiempoHorno: 50, temperaturaHorno: 180,
    query: 'cheesecake',
    ingredients: [
      { name: 'Queso crema', quantity: 500, unit: 'g' },
      { name: 'Huevos', quantity: 3, unit: 'unidad' },
      { name: 'Azúcar', quantity: 150, unit: 'g' },
      { name: 'Nata líquida', quantity: 200, unit: 'ml' },
      { name: 'Harina', quantity: 2, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Precalentar el horno a 180°C con calor arriba y abajo.' },
      { text: 'Mezclar el queso crema con el azúcar hasta obtener una crema suave.' },
      { text: 'Añadir los huevos uno a uno mezclando bien cada vez.' },
      { text: 'Incorporar la nata y la harina tamizada.' },
      { text: 'Verter en un molde forrado con papel de horno y hornear 50 minutos.' },
      { text: 'Dejar enfriar completamente antes de desmoldar.' }
    ],
    recommendations: 'Mejor de un día para otro. Se puede congelar hasta 2 meses.'
  },
  {
    title: 'Paella valenciana',
    description: 'La auténtica paella valenciana con pollo, conejo y judías.',
    text: 'Receta familiar transmitida de generación en generación en Valencia.',
    hashtags: ['paella', 'arroz', 'valenciana', 'tradicional'],
    raciones: 4, tiempoHorno: 20, temperaturaHorno: null,
    query: 'paella rice',
    ingredients: [
      { name: 'Arroz bomba', quantity: 400, unit: 'g' },
      { name: 'Pollo troceado', quantity: 500, unit: 'g' },
      { name: 'Conejo troceado', quantity: 300, unit: 'g' },
      { name: 'Judías verdes', quantity: 200, unit: 'g' },
      { name: 'Tomate triturado', quantity: 100, unit: 'g' },
      { name: 'Azafrán', quantity: 1, unit: 'pizca' }
    ],
    steps: [
      { text: 'Sofreír el pollo y el conejo con aceite de oliva hasta dorar.' },
      { text: 'Añadir las judías verdes y sofreír 5 minutos más.' },
      { text: 'Incorporar el tomate y el azafrán, cocinar 3 minutos.' },
      { text: 'Añadir el caldo caliente y cuando hierva echar el arroz.' },
      { text: 'Cocinar a fuego fuerte 10 minutos y luego bajar el fuego 8 minutos más.' },
      { text: 'Dejar reposar tapada con papel de aluminio 5 minutos.' }
    ],
    recommendations: 'El secreto está en el sofrito. No remover el arroz una vez echado.'
  },
  {
    title: 'Brownie de chocolate',
    description: 'Brownie húmedo y denso con pepitas de chocolate.',
    text: 'Mi debilidad. Lo hago cada domingo y nunca sobra.',
    hashtags: ['brownie', 'chocolate', 'postre', 'americano'],
    raciones: 12, tiempoHorno: 25, temperaturaHorno: 175,
    query: 'chocolate brownie',
    ingredients: [
      { name: 'Chocolate negro', quantity: 200, unit: 'g' },
      { name: 'Mantequilla', quantity: 150, unit: 'g' },
      { name: 'Azúcar', quantity: 250, unit: 'g' },
      { name: 'Huevos', quantity: 3, unit: 'unidad' },
      { name: 'Harina', quantity: 100, unit: 'g' }
    ],
    steps: [
      { text: 'Derretir el chocolate con la mantequilla al baño maría.' },
      { text: 'Batir los huevos con el azúcar hasta blanquear.' },
      { text: 'Mezclar el chocolate fundido con los huevos.' },
      { text: 'Añadir la harina tamizada y mezclar con movimientos envolventes.' },
      { text: 'Hornear en molde engrasado 25 minutos a 175°C.' }
    ],
    recommendations: 'El centro debe quedar húmedo. Si sale un palillo limpio está demasiado hecho.'
  },
  {
    title: 'Gazpacho andaluz',
    description: 'El gazpacho más refrescante para el verano.',
    text: 'En casa lo hacemos muy espeso, casi para comer con cuchara.',
    hashtags: ['gazpacho', 'verano', 'frio', 'andaluz', 'saludable'],
    raciones: 6, tiempoHorno: null, temperaturaHorno: null,
    query: 'gazpacho tomato soup',
    ingredients: [
      { name: 'Tomates maduros', quantity: 1, unit: 'kg' },
      { name: 'Pepino', quantity: 1, unit: 'unidad' },
      { name: 'Pimiento verde', quantity: 1, unit: 'unidad' },
      { name: 'Ajo', quantity: 1, unit: 'unidad' },
      { name: 'Pan del día anterior', quantity: 100, unit: 'g' },
      { name: 'Aceite de oliva', quantity: 100, unit: 'ml' },
      { name: 'Vinagre', quantity: 2, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Pelar y trocear todos los ingredientes.' },
      { text: 'Triturar todo junto con el aceite y el vinagre.' },
      { text: 'Colar para obtener una textura fina.' },
      { text: 'Rectificar de sal y refrigerar mínimo 2 horas.' }
    ],
    recommendations: 'Servir muy frío con guarnición de pepino, tomate y cebolla en daditos.'
  },
  {
    title: 'Croquetas de jamón',
    description: 'Croquetas cremosas con mucho jamón ibérico.',
    text: 'La receta más laboriosa pero la que más gusta en casa.',
    hashtags: ['croquetas', 'jamon', 'tapas', 'español'],
    raciones: 30, tiempoHorno: null, temperaturaHorno: null,
    query: 'croquettes spanish tapas',
    ingredients: [
      { name: 'Jamón ibérico', quantity: 200, unit: 'g' },
      { name: 'Leche entera', quantity: 1, unit: 'l' },
      { name: 'Harina', quantity: 100, unit: 'g' },
      { name: 'Mantequilla', quantity: 80, unit: 'g' },
      { name: 'Huevo', quantity: 2, unit: 'unidad' },
      { name: 'Pan rallado', quantity: 200, unit: 'g' }
    ],
    steps: [
      { text: 'Hacer un roux con la mantequilla y la harina.' },
      { text: 'Añadir la leche caliente poco a poco sin dejar de remover.' },
      { text: 'Incorporar el jamón picado y cocinar 10 minutos a fuego bajo.' },
      { text: 'Extender en bandeja, tapar con film y refrigerar 4 horas.' },
      { text: 'Formar las croquetas, pasar por huevo y pan rallado.' },
      { text: 'Freír en aceite bien caliente hasta dorar.' }
    ],
    recommendations: 'La bechamel debe quedar muy espesa. Se pueden congelar antes de freír.'
  },
  {
    title: 'Ensalada César',
    description: 'La clásica ensalada César con pollo a la plancha.',
    text: 'Mi ensalada favorita para comer ligero sin pasar hambre.',
    hashtags: ['ensalada', 'cesar', 'pollo', 'ligero', 'saludable'],
    raciones: 2, tiempoHorno: null, temperaturaHorno: null,
    query: 'caesar salad chicken',
    ingredients: [
      { name: 'Lechuga romana', quantity: 1, unit: 'unidad' },
      { name: 'Pechuga de pollo', quantity: 300, unit: 'g' },
      { name: 'Parmesano', quantity: 50, unit: 'g' },
      { name: 'Picatostes', quantity: 100, unit: 'g' },
      { name: 'Salsa César', quantity: 4, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Cocinar el pollo a la plancha con sal y pimienta.' },
      { text: 'Lavar y secar bien la lechuga romana.' },
      { text: 'Cortar el pollo en tiras y mezclar con la lechuga.' },
      { text: 'Añadir los picatostes, el parmesano y la salsa César.' }
    ],
    recommendations: 'La salsa César casera marca la diferencia. Usar anchoas de buena calidad.'
  },
  {
    title: 'Tortilla española',
    description: 'Tortilla de patata jugosa al estilo tradicional.',
    text: 'El debate eterno: con o sin cebolla. En casa, con cebolla.',
    hashtags: ['tortilla', 'patata', 'español', 'tradicional', 'huevos'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'spanish omelette tortilla',
    ingredients: [
      { name: 'Patatas', quantity: 600, unit: 'g' },
      { name: 'Huevos', quantity: 6, unit: 'unidad' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 200, unit: 'ml' },
      { name: 'Sal', quantity: 1, unit: 'pizca' }
    ],
    steps: [
      { text: 'Pelar y laminar las patatas y la cebolla.' },
      { text: 'Confitar las patatas y la cebolla en aceite de oliva a fuego bajo 20 minutos.' },
      { text: 'Escurrir el aceite y mezclar con los huevos batidos.' },
      { text: 'Cuajar en sartén antiadherente a fuego medio, dar la vuelta con un plato.' },
      { text: 'Terminar de cuajar al gusto, jugosa o bien hecha.' }
    ],
    recommendations: 'Cuanto más jugosa mejor. Dejar reposar 5 minutos antes de servir.'
  },
  {
    title: 'Tiramisú',
    description: 'El postre italiano por excelencia, suave y con sabor a café.',
    text: 'Lo aprendí en un viaje a Roma y desde entonces es el postre estrella en casa.',
    hashtags: ['tiramisu', 'italiano', 'postre', 'cafe'],
    raciones: 6, tiempoHorno: null, temperaturaHorno: null,
    query: 'tiramisu italian dessert',
    ingredients: [
      { name: 'Mascarpone', quantity: 500, unit: 'g' },
      { name: 'Huevos', quantity: 4, unit: 'unidad' },
      { name: 'Azúcar', quantity: 100, unit: 'g' },
      { name: 'Café espresso', quantity: 300, unit: 'ml' },
      { name: 'Bizcochos de soletilla', quantity: 24, unit: 'unidad' },
      { name: 'Cacao en polvo', quantity: 3, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Separar las yemas de las claras.' },
      { text: 'Batir las yemas con el azúcar hasta blanquear.' },
      { text: 'Mezclar el mascarpone con las yemas.' },
      { text: 'Montar las claras a punto de nieve e incorporar con movimientos envolventes.' },
      { text: 'Mojar los bizcochos en el café frío y colocar en la base del molde.' },
      { text: 'Cubrir con la crema de mascarpone y repetir capas.' },
      { text: 'Refrigerar 4 horas y espolvorear cacao antes de servir.' }
    ],
    recommendations: 'Mejor de un día para otro. El café debe estar completamente frío.'
  },
  {
    title: 'Salmón al horno con limón',
    description: 'Salmón jugoso al horno con hierbas aromáticas y limón.',
    text: 'Fácil, rápido y muy sano. Lo preparo al menos dos veces por semana.',
    hashtags: ['salmon', 'pescado', 'saludable', 'horno', 'limon'],
    raciones: 4, tiempoHorno: 20, temperaturaHorno: 200,
    query: 'salmon lemon herbs oven',
    ingredients: [
      { name: 'Lomo de salmón', quantity: 800, unit: 'g' },
      { name: 'Limón', quantity: 2, unit: 'unidad' },
      { name: 'Ajo', quantity: 3, unit: 'unidad' },
      { name: 'Eneldo fresco', quantity: 1, unit: 'cucharada' },
      { name: 'Aceite de oliva', quantity: 3, unit: 'cucharada' },
      { name: 'Sal y pimienta', quantity: 1, unit: 'pizca' }
    ],
    steps: [
      { text: 'Precalentar el horno a 200°C.' },
      { text: 'Colocar el salmón en una fuente de horno forrada con papel.' },
      { text: 'Mezclar el aceite, el ajo picado, el eneldo y el zumo de limón.' },
      { text: 'Verter la mezcla sobre el salmón y colocar rodajas de limón encima.' },
      { text: 'Hornear 18-20 minutos hasta que esté bien cocido.' }
    ],
    recommendations: 'No sobrecocinar. El salmón debe quedar rosado por dentro.'
  },
  {
    title: 'Hummus casero',
    description: 'Hummus cremoso y suave con toque de pimentón ahumado.',
    text: 'Desde que lo hago en casa no vuelvo a comprar el del súper.',
    hashtags: ['hummus', 'vegetariano', 'saludable', 'libanés'],
    raciones: 6, tiempoHorno: null, temperaturaHorno: null,
    query: 'hummus chickpeas',
    ingredients: [
      { name: 'Garbanzos cocidos', quantity: 400, unit: 'g' },
      { name: 'Tahini', quantity: 3, unit: 'cucharada' },
      { name: 'Limón', quantity: 1, unit: 'unidad' },
      { name: 'Ajo', quantity: 1, unit: 'unidad' },
      { name: 'Aceite de oliva', quantity: 4, unit: 'cucharada' },
      { name: 'Pimentón ahumado', quantity: 1, unit: 'cucharadita' }
    ],
    steps: [
      { text: 'Escurrir y enjuagar los garbanzos.' },
      { text: 'Triturar los garbanzos con el tahini, el zumo de limón y el ajo.' },
      { text: 'Añadir el aceite poco a poco mientras trituras.' },
      { text: 'Ajustar la textura con agua fría si está muy espeso.' },
      { text: 'Servir con un hilo de aceite y pimentón ahumado por encima.' }
    ],
    recommendations: 'Quitar la piel de los garbanzos para conseguir una textura más fina.'
  },
  {
    title: 'Ramen casero',
    description: 'Ramen japonés con caldo intenso, huevo marinado y cerdo.',
    text: 'Tardé meses en perfeccionar esta receta. Ahora ya no pido en restaurantes.',
    hashtags: ['ramen', 'japonés', 'sopa', 'asiático', 'cerdo'],
    raciones: 2, tiempoHorno: null, temperaturaHorno: null,
    query: 'ramen japanese noodles',
    ingredients: [
      { name: 'Fideos ramen', quantity: 200, unit: 'g' },
      { name: 'Caldo de pollo', quantity: 1, unit: 'l' },
      { name: 'Panceta de cerdo', quantity: 300, unit: 'g' },
      { name: 'Huevos', quantity: 2, unit: 'unidad' },
      { name: 'Salsa de soja', quantity: 4, unit: 'cucharada' },
      { name: 'Cebolleta', quantity: 2, unit: 'unidad' },
      { name: 'Alga nori', quantity: 2, unit: 'unidad' }
    ],
    steps: [
      { text: 'Marinar la panceta en soja, mirin y sake durante 2 horas.' },
      { text: 'Cocer la panceta a fuego lento 2 horas hasta que esté muy tierna.' },
      { text: 'Preparar los huevos marinados: cocer 7 minutos, pelar y marinar en soja.' },
      { text: 'Calentar el caldo con pasta de miso y sazonar.' },
      { text: 'Cocer los fideos según indicaciones del paquete.' },
      { text: 'Montar el bol: fideos, caldo, panceta en lonchas, huevo partido y cebolleta.' }
    ],
    recommendations: 'El caldo es la clave. Cuanto más tiempo lo cuezas más intenso quedará.'
  },
  {
    title: 'Bizcocho de limón y yogur',
    description: 'Bizcocho esponjoso y húmedo con glaseado de limón.',
    text: 'El bizcocho de los domingos de mi infancia. Siempre triunfa.',
    hashtags: ['bizcocho', 'limon', 'yogur', 'postre', 'merienda'],
    raciones: 8, tiempoHorno: 40, temperaturaHorno: 175,
    query: 'lemon yogurt cake',
    ingredients: [
      { name: 'Yogur natural', quantity: 125, unit: 'g' },
      { name: 'Harina', quantity: 250, unit: 'g' },
      { name: 'Azúcar', quantity: 200, unit: 'g' },
      { name: 'Huevos', quantity: 3, unit: 'unidad' },
      { name: 'Aceite de girasol', quantity: 100, unit: 'ml' },
      { name: 'Levadura', quantity: 1, unit: 'cucharadita' },
      { name: 'Limón', quantity: 1, unit: 'unidad' }
    ],
    steps: [
      { text: 'Batir los huevos con el azúcar hasta doblar el volumen.' },
      { text: 'Añadir el yogur, el aceite y la ralladura y zumo del limón.' },
      { text: 'Tamizar la harina con la levadura e incorporar a la mezcla.' },
      { text: 'Verter en molde engrasado y hornear 40 minutos a 175°C.' },
      { text: 'Preparar el glaseado: azúcar glass con zumo de limón y verter sobre el bizcocho frío.' }
    ],
    recommendations: 'No abrir el horno antes de los 35 minutos. El palillo debe salir limpio.'
  },
  {
    title: 'Pollo al curry con leche de coco',
    description: 'Curry de pollo cremoso con leche de coco y especias aromáticas.',
    text: 'Me enganché a la cocina india durante un viaje y este es mi favorito.',
    hashtags: ['curry', 'pollo', 'indio', 'especias', 'coco'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'chicken curry coconut milk',
    ingredients: [
      { name: 'Pechuga de pollo', quantity: 700, unit: 'g' },
      { name: 'Leche de coco', quantity: 400, unit: 'ml' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Pasta de curry', quantity: 3, unit: 'cucharada' },
      { name: 'Tomate triturado', quantity: 200, unit: 'g' },
      { name: 'Jengibre fresco', quantity: 1, unit: 'cucharadita' }
    ],
    steps: [
      { text: 'Sofreír la cebolla picada en aceite hasta dorar.' },
      { text: 'Añadir el jengibre rallado y la pasta de curry, cocinar 2 minutos.' },
      { text: 'Incorporar el pollo troceado y sellarlo bien.' },
      { text: 'Añadir el tomate y cocinar 5 minutos.' },
      { text: 'Incorporar la leche de coco y cocinar a fuego medio 15 minutos.' }
    ],
    recommendations: 'Acompañar con arroz basmati. Añadir cilantro fresco al final.'
  },
  {
    title: 'Guacamole casero',
    description: 'Guacamole fresco y cremoso con tomate, cebolla y jalapeño.',
    text: 'El truco está en que el aguacate esté perfectamente maduro.',
    hashtags: ['guacamole', 'mexicano', 'aguacate', 'vegetariano'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'guacamole avocado',
    ingredients: [
      { name: 'Aguacates maduros', quantity: 3, unit: 'unidad' },
      { name: 'Tomate', quantity: 1, unit: 'unidad' },
      { name: 'Cebolla roja', quantity: 0.5, unit: 'unidad' },
      { name: 'Jalapeño', quantity: 1, unit: 'unidad' },
      { name: 'Cilantro fresco', quantity: 2, unit: 'cucharada' },
      { name: 'Limón', quantity: 1, unit: 'unidad' }
    ],
    steps: [
      { text: 'Cortar los aguacates por la mitad y retirar el hueso.' },
      { text: 'Sacar la pulpa con una cuchara y aplastar con un tenedor.' },
      { text: 'Añadir el zumo de limón inmediatamente para evitar la oxidación.' },
      { text: 'Picar finamente el tomate, la cebolla y el jalapeño.' },
      { text: 'Mezclar todo con el cilantro picado y sazonar.' }
    ],
    recommendations: 'Preparar justo antes de servir. El hueso del aguacate no evita la oxidación.'
  },
  {
    title: 'Risotto de setas',
    description: 'Risotto cremoso con setas variadas y parmesano.',
    text: 'El risotto requiere paciencia pero el resultado vale cada minuto.',
    hashtags: ['risotto', 'setas', 'italiano', 'arroz', 'vegetariano'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'risotto mushrooms',
    ingredients: [
      { name: 'Arroz arborio', quantity: 320, unit: 'g' },
      { name: 'Setas variadas', quantity: 400, unit: 'g' },
      { name: 'Caldo de verduras', quantity: 1.5, unit: 'l' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Vino blanco', quantity: 150, unit: 'ml' },
      { name: 'Parmesano', quantity: 80, unit: 'g' },
      { name: 'Mantequilla', quantity: 50, unit: 'g' }
    ],
    steps: [
      { text: 'Saltear las setas con mantequilla y reservar.' },
      { text: 'Sofreír la cebolla picada hasta transparentar.' },
      { text: 'Añadir el arroz y tostar 2 minutos.' },
      { text: 'Incorporar el vino y dejar evaporar.' },
      { text: 'Añadir el caldo caliente cazo a cazo, removiendo constantemente.' },
      { text: 'Incorporar las setas y el parmesano rallado al final.' }
    ],
    recommendations: 'El caldo debe estar siempre caliente. Remover constantemente para soltar el almidón.'
  },
  {
    title: 'Pad Thai',
    description: 'El clásico wok tailandés con fideos, gambas y cacahuetes.',
    text: 'Después de probar el original en Bangkok intenté recrearlo en casa.',
    hashtags: ['padthai', 'tailandés', 'asiático', 'fideos', 'gambas'],
    raciones: 2, tiempoHorno: null, temperaturaHorno: null,
    query: 'pad thai noodles',
    ingredients: [
      { name: 'Fideos de arroz', quantity: 200, unit: 'g' },
      { name: 'Gambas', quantity: 200, unit: 'g' },
      { name: 'Huevos', quantity: 2, unit: 'unidad' },
      { name: 'Salsa de ostras', quantity: 2, unit: 'cucharada' },
      { name: 'Salsa de pescado', quantity: 2, unit: 'cucharada' },
      { name: 'Cacahuetes', quantity: 50, unit: 'g' },
      { name: 'Cebolleta', quantity: 3, unit: 'unidad' }
    ],
    steps: [
      { text: 'Remojar los fideos en agua caliente 15 minutos.' },
      { text: 'Saltear las gambas en wok con aceite muy caliente.' },
      { text: 'Apartar las gambas y scramble los huevos en el wok.' },
      { text: 'Añadir los fideos escurridos y las salsas.' },
      { text: 'Incorporar las gambas y la cebolleta troceada.' },
      { text: 'Servir con cacahuetes picados y lima.' }
    ],
    recommendations: 'El wok debe estar muy caliente. Preparar todos los ingredientes antes de empezar.'
  },
  {
    title: 'Lentejas con chorizo',
    description: 'Lentejas tradicionales españolas con chorizo y morcilla.',
    text: 'El plato de cuchara que más me reconforta en invierno.',
    hashtags: ['lentejas', 'chorizo', 'legumbres', 'tradicional', 'invierno'],
    raciones: 6, tiempoHorno: null, temperaturaHorno: null,
    query: 'lentil stew chorizo',
    ingredients: [
      { name: 'Lentejas pardinas', quantity: 400, unit: 'g' },
      { name: 'Chorizo', quantity: 150, unit: 'g' },
      { name: 'Morcilla', quantity: 100, unit: 'g' },
      { name: 'Zanahoria', quantity: 2, unit: 'unidad' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Pimentón dulce', quantity: 1, unit: 'cucharadita' }
    ],
    steps: [
      { text: 'Sofreír la cebolla y la zanahoria picadas.' },
      { text: 'Añadir el pimentón y el chorizo troceado.' },
      { text: 'Incorporar las lentejas sin remojar previo.' },
      { text: 'Cubrir con agua fría y cocinar 35-40 minutos.' },
      { text: 'Añadir la morcilla los últimos 10 minutos.' }
    ],
    recommendations: 'No echar sal hasta el final. Las lentejas pardinas no necesitan remojo.'
  },
  {
    title: 'Pizza margarita casera',
    description: 'Pizza napolitana con masa fina, tomate y mozzarella fresca.',
    text: 'Hacer la masa en casa marca la diferencia. Nunca vuelves a pedir pizza.',
    hashtags: ['pizza', 'italiano', 'masa', 'mozzarella'],
    raciones: 2, tiempoHorno: 12, temperaturaHorno: 250,
    query: 'pizza margherita',
    ingredients: [
      { name: 'Harina de fuerza', quantity: 300, unit: 'g' },
      { name: 'Levadura seca', quantity: 7, unit: 'g' },
      { name: 'Tomate triturado', quantity: 200, unit: 'g' },
      { name: 'Mozzarella fresca', quantity: 250, unit: 'g' },
      { name: 'Albahaca fresca', quantity: 1, unit: 'cucharada' },
      { name: 'Aceite de oliva', quantity: 2, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Mezclar la harina con la levadura, sal y agua templada hasta obtener masa.' },
      { text: 'Amasar 10 minutos y dejar reposar 1 hora tapada.' },
      { text: 'Extender la masa muy fina con el rodillo.' },
      { text: 'Cubrir con tomate sazonado con aceite y orégano.' },
      { text: 'Hornear 10 minutos a 250°C y añadir la mozzarella los últimos 2 minutos.' },
      { text: 'Añadir albahaca fresca al sacar del horno.' }
    ],
    recommendations: 'El horno debe estar al máximo. Una piedra de horno mejora mucho el resultado.'
  },
  {
    title: 'Crema de calabaza',
    description: 'Crema de calabaza suave y reconfortante con jengibre.',
    text: 'Mi sopa favorita de otoño. La hago en grandes cantidades para congelar.',
    hashtags: ['calabaza', 'crema', 'sopa', 'vegetariano', 'otoño'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'pumpkin cream soup',
    ingredients: [
      { name: 'Calabaza', quantity: 800, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Jengibre', quantity: 1, unit: 'cucharadita' },
      { name: 'Caldo de verduras', quantity: 700, unit: 'ml' },
      { name: 'Nata para cocinar', quantity: 100, unit: 'ml' },
      { name: 'Aceite de oliva', quantity: 2, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Pelar y trocear la calabaza y la cebolla.' },
      { text: 'Sofreír la cebolla hasta transparentar.' },
      { text: 'Añadir la calabaza y el jengibre, cocinar 5 minutos.' },
      { text: 'Cubrir con el caldo y cocinar 20 minutos hasta que esté tierna.' },
      { text: 'Triturar hasta obtener una crema fina y añadir la nata.' }
    ],
    recommendations: 'Servir con pipas de calabaza tostadas y un hilo de aceite de oliva virgen extra.'
  },
  {
    title: 'Tacos de pollo',
    description: 'Tacos mexicanos con pollo marinado, guacamole y pico de gallo.',
    text: 'Los tacos de los martes son ya tradición en casa.',
    hashtags: ['tacos', 'mexicano', 'pollo', 'guacamole'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'chicken tacos mexican',
    ingredients: [
      { name: 'Pechuga de pollo', quantity: 600, unit: 'g' },
      { name: 'Tortillas de maíz', quantity: 8, unit: 'unidad' },
      { name: 'Aguacate', quantity: 2, unit: 'unidad' },
      { name: 'Tomate', quantity: 2, unit: 'unidad' },
      { name: 'Cebolla', quantity: 1, unit: 'unidad' },
      { name: 'Especias mexicanas', quantity: 2, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Marinar el pollo con las especias, sal y aceite durante 30 minutos.' },
      { text: 'Cocinar el pollo a la plancha y desmenuzarlo.' },
      { text: 'Preparar el guacamole aplastando el aguacate con limón y sal.' },
      { text: 'Preparar el pico de gallo con tomate, cebolla y cilantro picados.' },
      { text: 'Calentar las tortillas y montar los tacos.' }
    ],
    recommendations: 'Las tortillas deben calentarse en seco en una sartén. Servir inmediatamente.'
  },
  {
    title: 'Tarta de manzana',
    description: 'Tarta de manzana francesa con masa brisa y crema de vainilla.',
    text: 'El olor que desprende mientras se hornea es simplemente mágico.',
    hashtags: ['tarta', 'manzana', 'postre', 'francesa'],
    raciones: 8, tiempoHorno: 35, temperaturaHorno: 180,
    query: 'apple tart french',
    ingredients: [
      { name: 'Manzanas golden', quantity: 4, unit: 'unidad' },
      { name: 'Masa brisa', quantity: 1, unit: 'unidad' },
      { name: 'Mantequilla', quantity: 50, unit: 'g' },
      { name: 'Azúcar', quantity: 80, unit: 'g' },
      { name: 'Canela', quantity: 1, unit: 'cucharadita' },
      { name: 'Mermelada de albaricoque', quantity: 3, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Extender la masa brisa en el molde y pinchar con tenedor.' },
      { text: 'Pelar y laminar las manzanas finamente.' },
      { text: 'Colocar las manzanas en abanico sobre la masa.' },
      { text: 'Espolvorear azúcar y canela, añadir trocitos de mantequilla.' },
      { text: 'Hornear 35 minutos a 180°C.' },
      { text: 'Pintar con la mermelada caliente para dar brillo.' }
    ],
    recommendations: 'La mermelada de albaricoque da el brillo característico. No sustituir.'
  },
  {
    title: 'Bacalao al pil pil',
    description: 'Bacalao tradicional vasco con salsa pil pil emulsionada.',
    text: 'Necesita técnica pero una vez que le coges el truco es adictivo.',
    hashtags: ['bacalao', 'pilpil', 'vasco', 'pescado', 'tradicional'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'bacalao cod spanish',
    ingredients: [
      { name: 'Bacalao desalado', quantity: 800, unit: 'g' },
      { name: 'Ajo', quantity: 6, unit: 'unidad' },
      { name: 'Aceite de oliva virgen', quantity: 300, unit: 'ml' },
      { name: 'Guindilla', quantity: 1, unit: 'unidad' }
    ],
    steps: [
      { text: 'Confitar el ajo laminado en el aceite a fuego muy bajo hasta dorar.' },
      { text: 'Retirar el ajo y la guindilla y reservar.' },
      { text: 'Añadir el bacalao con la piel hacia arriba al aceite tibio.' },
      { text: 'Cocinar a fuego muy bajo 15 minutos moviendo la cazuela.' },
      { text: 'Retirar el bacalao y emulsionar la salsa con movimientos circulares.' },
      { text: 'Volver a incorporar el bacalao y decorar con el ajo y la guindilla.' }
    ],
    recommendations: 'La temperatura del aceite es clave. Nunca debe hervir. La gelatina del bacalao liga la salsa.'
  },
  {
    title: 'Poke bowl de atún',
    description: 'Bowl hawaiano con atún marinado, aguacate y arroz de sushi.',
    text: 'Mi almuerzo favorito cuando quiero comer sano y rico a la vez.',
    hashtags: ['poke', 'hawaiano', 'atun', 'saludable', 'bowl'],
    raciones: 2, tiempoHorno: null, temperaturaHorno: null,
    query: 'poke bowl tuna',
    ingredients: [
      { name: 'Atún fresco', quantity: 300, unit: 'g' },
      { name: 'Arroz de sushi', quantity: 200, unit: 'g' },
      { name: 'Aguacate', quantity: 1, unit: 'unidad' },
      { name: 'Edamame', quantity: 100, unit: 'g' },
      { name: 'Salsa de soja', quantity: 3, unit: 'cucharada' },
      { name: 'Aceite de sésamo', quantity: 1, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Cocer el arroz y aliñar con vinagre de arroz y azúcar.' },
      { text: 'Cortar el atún en daditos y marinar en soja y aceite de sésamo 15 minutos.' },
      { text: 'Laminar el aguacate y cocer el edamame.' },
      { text: 'Montar el bowl con el arroz de base.' },
      { text: 'Colocar el atún, el aguacate y el edamame encima.' },
      { text: 'Aliñar con más salsa de soja y semillas de sésamo.' }
    ],
    recommendations: 'Usar atún de calidad sashimi. El marinado no debe exceder 30 minutos.'
  },
  {
    title: 'Crêpes suzette',
    description: 'Crêpes flambeados con salsa de naranja y mantequilla.',
    text: 'El postre más elegante que sé hacer. Siempre impresiona a los invitados.',
    hashtags: ['crepes', 'frances', 'postre', 'naranja', 'flambeado'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'crepes suzette orange',
    ingredients: [
      { name: 'Harina', quantity: 125, unit: 'g' },
      { name: 'Leche', quantity: 300, unit: 'ml' },
      { name: 'Huevos', quantity: 2, unit: 'unidad' },
      { name: 'Naranja', quantity: 2, unit: 'unidad' },
      { name: 'Mantequilla', quantity: 80, unit: 'g' },
      { name: 'Azúcar', quantity: 60, unit: 'g' },
      { name: 'Cointreau', quantity: 3, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Hacer la masa de crêpes mezclando harina, huevos y leche.' },
      { text: 'Reposar la masa 30 minutos en nevera.' },
      { text: 'Cocinar los crêpes finos en sartén antiadherente.' },
      { text: 'Preparar la salsa: mantequilla, azúcar, zumo y ralladura de naranja.' },
      { text: 'Doblar los crêpes en cuartos y calentarlos en la salsa.' },
      { text: 'Añadir el Cointreau y flambear con cuidado.' }
    ],
    recommendations: 'Para el flambeado, inclinar la sartén hacia la llama o usar un mechero. Tener cuidado.'
  },
  {
    title: 'Pollo asado al limón',
    description: 'Pollo entero asado con limón, ajo y hierbas provenzales.',
    text: 'El pollo asado del domingo. Nada más simple y nada más rico.',
    hashtags: ['pollo', 'asado', 'domingo', 'limon', 'tradicional'],
    raciones: 4, tiempoHorno: 90, temperaturaHorno: 190,
    query: 'roast chicken lemon herbs',
    ingredients: [
      { name: 'Pollo entero', quantity: 1.5, unit: 'kg' },
      { name: 'Limón', quantity: 2, unit: 'unidad' },
      { name: 'Ajo', quantity: 6, unit: 'unidad' },
      { name: 'Romero', quantity: 2, unit: 'cucharada' },
      { name: 'Tomillo', quantity: 1, unit: 'cucharada' },
      { name: 'Aceite de oliva', quantity: 4, unit: 'cucharada' }
    ],
    steps: [
      { text: 'Mezclar el aceite con las hierbas, el ajo picado y la ralladura de limón.' },
      { text: 'Untar el pollo por dentro y por fuera con la mezcla.' },
      { text: 'Introducir el limón partido por la mitad dentro del pollo.' },
      { text: 'Hornear 90 minutos a 190°C, regando con los jugos cada 30 minutos.' },
      { text: 'Dejar reposar 10 minutos antes de trinchar.' }
    ],
    recommendations: 'El pollo debe estar a temperatura ambiente antes de hornear. Regar con los jugos es clave.'
  },
  {
    title: 'Mousse de chocolate',
    description: 'Mousse de chocolate negro ligera y aireada.',
    text: 'Tres ingredientes y el resultado parece de restaurante de lujo.',
    hashtags: ['mousse', 'chocolate', 'postre', 'frances', 'facil'],
    raciones: 6, tiempoHorno: null, temperaturaHorno: null,
    query: 'chocolate mousse',
    ingredients: [
      { name: 'Chocolate negro 70%', quantity: 200, unit: 'g' },
      { name: 'Huevos', quantity: 4, unit: 'unidad' },
      { name: 'Azúcar', quantity: 50, unit: 'g' },
      { name: 'Nata para montar', quantity: 200, unit: 'ml' }
    ],
    steps: [
      { text: 'Derretir el chocolate al baño maría y dejar templar.' },
      { text: 'Separar yemas y claras. Batir yemas con azúcar hasta blanquear.' },
      { text: 'Incorporar el chocolate a las yemas.' },
      { text: 'Montar la nata y las claras por separado a punto de nieve.' },
      { text: 'Incorporar la nata y las claras al chocolate con movimientos envolventes.' },
      { text: 'Refrigerar mínimo 3 horas antes de servir.' }
    ],
    recommendations: 'Los movimientos envolventes son clave para no perder el aire. No meter en el congelador.'
  },
  {
    title: 'Fideuà valenciana',
    description: 'Fideuà de marisco al estilo tradicional valenciano.',
    text: 'Para mí mejor que la paella. El tostado de los fideos es espectacular.',
    hashtags: ['fideua', 'marisco', 'valenciana', 'fideos', 'pescado'],
    raciones: 4, tiempoHorno: null, temperaturaHorno: null,
    query: 'fideua seafood noodles',
    ingredients: [
      { name: 'Fideos nº4', quantity: 400, unit: 'g' },
      { name: 'Gambas', quantity: 300, unit: 'g' },
      { name: 'Mejillones', quantity: 500, unit: 'g' },
      { name: 'Calamar', quantity: 300, unit: 'g' },
      { name: 'Caldo de pescado', quantity: 1, unit: 'l' },
      { name: 'Tomate triturado', quantity: 100, unit: 'g' },
      { name: 'Azafrán', quantity: 1, unit: 'pizca' }
    ],
    steps: [
      { text: 'Tostar los fideos en la paellera con aceite hasta dorar.' },
      { text: 'Reservar los fideos y sofreír el calamar y las gambas.' },
      { text: 'Añadir el tomate y el azafrán, cocinar 3 minutos.' },
      { text: 'Incorporar los fideos tostados.' },
      { text: 'Añadir el caldo caliente y cocinar 8-10 minutos.' },
      { text: 'Añadir los mejillones al final y dejar reposar tapada.' }
    ],
    recommendations: 'El tostado de los fideos es lo que da el sabor especial. Servir con alioli.'
  },
  {
    title: 'Pan de masa madre',
    description: 'Pan artesanal de masa madre con corteza crujiente.',
    text: 'Llevo 2 años cultivando mi masa madre. El pan más satisfactorio que hago.',
    hashtags: ['pan', 'masaMadre', 'artesanal', 'panaderia'],
    raciones: 8, tiempoHorno: 45, temperaturaHorno: 230,
    query: 'sourdough bread artisan',
    ingredients: [
      { name: 'Harina de fuerza', quantity: 450, unit: 'g' },
      { name: 'Masa madre activa', quantity: 100, unit: 'g' },
      { name: 'Agua', quantity: 350, unit: 'ml' },
      { name: 'Sal', quantity: 10, unit: 'g' }
    ],
    steps: [
      { text: 'Mezclar la harina con el agua y reposar 1 hora (autólisis).' },
      { text: 'Añadir la masa madre y la sal, amasar hasta integrar.' },
      { text: 'Hacer pliegues cada 30 minutos durante 3 horas.' },
      { text: 'Dar forma y refrigerar toda la noche.' },
      { text: 'Precalentar el horno con una cocotte a 230°C.' },
      { text: 'Hornear tapado 20 minutos y destapado 25 minutos más.' }
    ],
    recommendations: 'La masa madre debe estar activa y burbujeante. La cocotte crea el vapor necesario.'
  }
];

// funcion para descargar imagen de unsplash
async function subirACloudinary(query, carpeta) {
  return new Promise((resolve, reject) => {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_KEY}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          const imageUrl = json.urls?.regular;

          if (!imageUrl) {
            console.log(`No se encontró imagen para: ${query}`);
            resolve(null);
            return;
          }

          // descargamos la imagen en memoria
          const imageBuffer = await new Promise((res, rej) => {
            https.get(imageUrl, (imgRes) => {
              const chunks = [];
              imgRes.on('data', chunk => chunks.push(chunk));
              imgRes.on('end', () => res(Buffer.concat(chunks)));
              imgRes.on('error', rej);
            }).on('error', rej);
          });

          // subimos directamente a cloudinary
          const resultado = await new Promise((res, rej) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: `cookee/${carpeta}` },
              (error, result) => {
                if (error) rej(error);
                else res(result);
              }
            );
            stream.end(imageBuffer);
          });

          resolve(resultado.secure_url);

        } catch (e) {
          console.log('Error subiendo imagen:', e.message);
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function descargarAvatar(query) {
  return subirACloudinary(query, 'avatars');
}

async function descargarPortada(query) {
  return subirACloudinary(query, 'publications');
}

async function seed() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado');

    console.log('Limpiando datos anteriores...');
    await User.deleteMany({});
    await Publication.deleteMany({});
    await Follow.deleteMany({});
    await Comment.deleteMany({});
    console.log('Base de datos limpiada');

    console.log('Creando usuarios...');
    const password = await bcrypt.hash('password123', 10);
    const usuarios = [];

    for (const u of usuariosSeed) {
      const avatarFile = `avatar_${u.nick}.jpg`;
      console.log(`  Descargando avatar para ${u.nick}...`);
      const avatarUrl = await descargarAvatar('chef cooking portrait');

      const usuario = new User({
        name: u.name,
        surname: u.surname,
        nick: u.nick,
        email: u.email,
        password,
        image: avatarUrl || null,
        role: 'user'
      });

      await usuario.save();
      usuarios.push(usuario);
      console.log(`  Usuario creado: ${u.nick}`);
    }

    console.log('Creando recetas...');
    const publicaciones = [];

    for (const receta of recetasSeed) {
      const autor = usuarios[Math.floor(Math.random() * usuarios.length)];
      const portadaFile = `portada_${receta.hashtags[0]}_${Date.now()}.jpg`;

      console.log(`  Descargando portada para ${receta.title}...`);
      const portadaUrl = await descargarPortada(receta.query);

      const pub = new Publication({
        user: autor._id,
        title: receta.title,
        description: receta.description,
        text: receta.text,
        hashtags: receta.hashtags,
        raciones: receta.raciones,
        tiempoHorno: receta.tiempoHorno,
        temperaturaHorno: receta.temperaturaHorno,
        ingredients: receta.ingredients,
        steps: receta.steps,
        recommendations: receta.recommendations,
        images: portadaUrl ? [portadaUrl] : [],
        likes: [],
        views: Math.floor(Math.random() * 500)
      });

      await pub.save();

      publicaciones.push(pub);
      console.log(`  Receta creada: ${receta.title}`);
    }

    console.log('Simulando follows...');
    for (const usuario of usuarios) {
      const otrosUsuarios = usuarios.filter(u => u._id.toString() !== usuario._id.toString());
      const aQuienSeguir = otrosUsuarios.sort(() => 0.5 - Math.random()).slice(0, 5);

      for (const seguido of aQuienSeguir) {
        await new Follow({ user: usuario._id, followed: seguido._id }).save();
      }
    }
    console.log('Follows creados');

    console.log('Simulando actividad...');
    const comentariosSeed = [
      '¡Qué receta tan buena! La hice el fin de semana y triunfé.',
      'Llevo años buscando esta receta, muchas gracias!',
      'La hice ayer y quedó espectacular. Repito seguro.',
      'Mi familia me pidió que la hiciera otra vez. Éxito total.',
      'Sencilla y deliciosa. Justo lo que buscaba.',
      'Increíble, nunca pensé que me saldría tan bien.',
      'Le añadí un poco más de sal y quedó perfecta.',
      'Esta receta es un clásico en mi casa ahora.',
      'Perfecta para una cena de cumpleaños. Todos repitieron.',
      'La textura quedó exactamente como en la foto. ¡Gracias!',
      'Modifiqué un par de cosas y quedó aún mejor.',
      'Primera vez que me sale bien a la primera. Receta muy clara.'
    ];

    for (const pub of publicaciones) {
      const likers = usuarios.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 10));
      pub.likes = likers.map(u => u._id);
      await pub.save();

      const numComentarios = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < numComentarios; i++) {
        const autor = usuarios[Math.floor(Math.random() * usuarios.length)];
        const texto = comentariosSeed[Math.floor(Math.random() * comentariosSeed.length)];
        await new Comment({
          text: texto,
          user: autor._id,
          publication: pub._id
        }).save();
      }
    }
    console.log('Actividad simulada');

    console.log('\n✅ Seed completado con éxito');
    console.log(`   ${usuarios.length} usuarios creados`);
    console.log(`   ${publicaciones.length} recetas creadas`);
    console.log('\n   Credenciales de acceso:');
    console.log('   Email: laura@cookee.com');
    console.log('   Password: password123');

    process.exit(0);

  } catch (error) {
    console.error('Error en el seed:', error);
    process.exit(1);
  }
}

seed();
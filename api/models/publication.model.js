'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

const IngredienteSchema = new Schema({
    name: { type: String, required: true },
    quantity: { type: Number, default: null },
    unit: {
        type: String,
        enum: ['g', 'kg', 'ml', 'l', 'cucharadita', 'cucharada', 'taza', 'unidad', 'pizca', 'tbsp', 'cup', 'tsp', 'oz'],
        default: 'unidad'
    }
}, { _id: false });

const PasoSchema = new Schema({
    text: { type: String, required: true },
    image: { type: String, default: null }
}, { _id: false });

const PublicationSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, default: '' },
    text: { type: String, default: '' },
    description: { type: String, default: '' },
    recommendations: { type: String, default: '' },
    ingredients: { type: [IngredienteSchema], default: [] },
    steps: { type: [PasoSchema], default: [] },
    images: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    tiempoHorno: { type: Number, default: null },
    temperaturaHorno: { type: Number, default: null },
    raciones: { type: Number, default: null },
    likes: { type: [{ type: Schema.ObjectId, ref: 'User' }], default: [] },
    views: { type: Number, default: 0 }
}, { timestamps: true });

PublicationSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Publication', PublicationSchema);
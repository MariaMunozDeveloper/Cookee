'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const FavoriteSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User', required: true },
    publication: { type: Schema.ObjectId, ref: 'Publication', required: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Favorite', FavoriteSchema);
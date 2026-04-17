'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
    text: { type: String, required: true },
    user: { type: Schema.ObjectId, ref: 'User', required: true },
    publication: { type: Schema.ObjectId, ref: 'Publication', required: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Comment', CommentSchema);
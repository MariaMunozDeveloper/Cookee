'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { Schema } = mongoose;

const MessageSchema = new Schema({
    text: { type: String, required: true },
    viewed: { type: Boolean, default: false },
    emitter: { type: Schema.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
    versionKey: false
});

MessageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Message', MessageSchema);
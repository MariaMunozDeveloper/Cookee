'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongoosePaginate = require('mongoose-paginate-v2');

const UserSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    nick: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'ROLE_USER' },
    image: { type: String, default: null },

}, {
    timestamps: true,
    versionKey: false
});

UserSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', UserSchema);
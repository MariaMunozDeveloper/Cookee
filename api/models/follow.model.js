'use strict';

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { Schema } = mongoose;

const FollowSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    followed: { type: Schema.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    versionKey: false
});

FollowSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Follow', FollowSchema);
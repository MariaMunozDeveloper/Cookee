'use strict';

const jwtService = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_dev';

exports.createAccessToken = function (user) {
    const payload = {
        sub: user._id,
        role: user.role,
        nick: user.nick,
        email: user.email
    };

    return jwtService.sign(payload, accessSecret, {
        expiresIn: '30m'
    });
};

exports.createRefreshToken = function (user) {
    const payload = {
        sub: user._id
    };

    return jwtService.sign(payload, refreshSecret, {
        expiresIn: '7d'
    });
};

exports.accessSecret = accessSecret;
exports.refreshSecret = refreshSecret;
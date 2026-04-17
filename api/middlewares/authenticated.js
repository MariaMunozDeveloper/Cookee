'use strict';

const jwt = require('jsonwebtoken');
const jwtService = require('../services/jwt.service');

const ensureAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                status: false,
                message: 'Falta la cabecera de autenticación'
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: false,
                message: 'Formato de token inválido'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: false,
                message: 'Token no proporcionado'
            });
        }

        const payload = jwt.verify(token, jwtService.accessSecret);

        req.user = payload;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: false,
                message: 'Token expirado'
            });
        }

        return res.status(401).json({
            status: false,
            message: 'Token inválido'
        });
    }
};

module.exports = {
    ensureAuth
};
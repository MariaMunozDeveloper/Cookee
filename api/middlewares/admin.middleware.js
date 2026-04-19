'use strict';

const ensureAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ROLE_ADMIN') {
        return res.status(403).json({
            status: false,
            message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
    next();
};

module.exports = { ensureAdmin };
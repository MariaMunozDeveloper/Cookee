'use strict';

const Follow = require('../models/follow.model');
const followController = {};


followController.saveFollow = async (req, res) => {
    try {
        const miId = req.user.sub;
        const seguidoId = req.body.followed;

        if (!seguidoId) {
            return res.status(400).json({
                status: false,
                message: 'Falta el id del usuario a seguir'
            });
        }

        if (miId === seguidoId) {
            return res.status(400).json({
                status: false,
                message: 'No puedes seguirte a ti mismo'
            });
        }

        const yaExiste = await Follow.findOne({
            user: miId,
            followed: seguidoId
        });

        if (yaExiste) {
            return res.status(409).json({
                status: false,
                message: 'Ya sigues a este usuario'
            });
        }

        const follow = new Follow({
            user: miId,
            followed: seguidoId
        });

        const followGuardado = await follow.save();

        return res.status(201).json({
            status: true,
            message: 'Usuario seguido correctamente',
            follow: followGuardado
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

followController.deleteFollow = async (req, res) => {
    try {
        const miId = req.user.sub;
        const seguidoId = req.params.id;

        const follow = await Follow.findOneAndDelete({
            user: miId,
            followed: seguidoId
        });

        if (!follow) {
            return res.status(404).json({
                status: false,
                message: 'No estabas siguiendo a este usuario'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Has dejado de seguir al usuario'
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

followController.getFollowingUsers = async (req, res) => {
    try {
        let userId = req.user.sub;

        if (req.params.id) {
            userId = req.params.id;
        }

        let page = parseInt(req.query.page) || 1;
        let items = parseInt(req.query.limit) || 4;

        const result = await Follow.paginate(
            { user: userId },
            {
                page: page,
                limit: items,
                sort: { createdAt: -1 },
                populate: {
                    path: 'followed',
                    select: '-password -__v'
                }
            }
        );

        return res.status(200).json({
            status: true,
            total: result.totalDocs,
            pages: result.totalPages,
            page: result.page,
            follows: result.docs
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

followController.getFollowedUsers = async (req, res) => {
    try {
        let userId = req.user.sub;

        if (req.params.id) {
            userId = req.params.id;
        }

        let page = parseInt(req.query.page) || 1;
        let items = parseInt(req.query.limit) || 4;

        const result = await Follow.paginate(
            { followed: userId },
            {
                page: page,
                limit: items,
                sort: { createdAt: -1 },
                populate: {
                    path: 'user',
                    select: '-password -__v'
                }
            }
        );

        return res.status(200).json({
            status: true,
            total: result.totalDocs,
            pages: result.totalPages,
            page: result.page,
            follows: result.docs
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

followController.getMyFollows = async (req, res) => {
    try {
        const userId = req.user.sub;

        const follows = await Follow.find({ user: userId })
            .populate('followed', '-password -__v');

        return res.status(200).json({
            status: true,
            follows
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

followController.getYourFollows = async (req, res) => {
    try {
        const userId = req.user.sub;

        const follows = await Follow.find({ followed: userId })
            .populate('user', '-password -__v');

        return res.status(200).json({
            status: true,
            follows
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

module.exports = followController;

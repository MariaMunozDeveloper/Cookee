'use strict';

const User = require('../models/user.model');
const userController = {};
const bcrypt = require('bcryptjs');
const jwtService = require('../services/jwt.service');
const cloudinary = require('../config/cloudinary');
const Publication = require('../models/publication.model');

userController.register = async (req, res) => {
    const params = req.body;
    const user = new User();

    if (params.name && params.surname && params.nick && params.email && params.password) {
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick.toLowerCase();
        user.email = params.email.toLowerCase();
        user.role = 'ROLE_USER';
        user.image = null;

        try {
            const users = await User.find({
                $or: [
                    { email: user.email },
                    { nick: user.nick }
                ]
            });

            if (users && users.length >= 1) {
                return res.status(409).json({
                    status: false,
                    message: 'El usuario que intentas registrar ya existe'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(params.password, salt);
            user.password = hash;

            const userStored = await user.save();

            const userResponse = userStored.toObject();
            delete userResponse.password;

            return res.status(201).json({
                status: true,
                message: 'Usuario registrado correctamente',
                user: userResponse
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                message: err.message
            });
        }

    } else {
        return res.status(400).json({
            status: false,
            message: 'Faltan campos obligatorios'
        });
    }
};

userController.login = async (req, res) => {
    const params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).json({
            status: false,
            message: 'Faltan datos'
        });
    }

    try {
        const user = await User.findOne({
            email: params.email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                status: false,
                message: 'Credenciales incorrectas'
            });
        }

        const validPassword = await bcrypt.compare(params.password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                status: false,
                message: 'Credenciales incorrectas'
            });
        }

        const accessToken = jwtService.createAccessToken(user);
        const refreshToken = jwtService.createRefreshToken(user);

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        return res.status(200).json({
            status: true,
            message: 'Login correcto',
            user: userWithoutPassword,
            accessToken,
            refreshToken
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

userController.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const miId = req.user.sub;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'El usuario no existe'
            });
        }

        const followInfo = await followThisUser(miId, userId);

        return res.status(200).json({
            status: true,
            user,
            following: followInfo.following,
            followed: followInfo.followed
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

userController.listUsers = async (req, res) => {
    try {
        const miId = req.user.sub;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 10, 1);
        const search = req.query.search || '';

        const filter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { nick: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const options = {
            page,
            limit,
            sort: { createdAt: -1 },
            select: '-password'
        };

        const result = await User.paginate(filter, options);

        const followInfo = await followUserIds(miId);

        return res.status(200).json({
            status: true,
            users: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            following: followInfo.following,
            followed: followInfo.followed
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

userController.updateUser = async (req, res) => {
    try {
        const userId = req.user.sub;
        const updateData = req.body;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] === null || updateData[key] === '') {
                delete updateData[key];
            }
        });

        delete updateData._id;
        delete updateData.role;

        if (updateData.email || updateData.nick) {
            const users = await User.find({
                $or: [
                    { email: updateData.email?.toLowerCase() },
                    { nick: updateData.nick?.toLowerCase() }
                ]
            });

            const userIsset = users.find(user => user._id.toString() !== userId);

            if (userIsset) {
                if (updateData.email && userIsset.email === updateData.email.toLowerCase()) {
                    return res.status(409).json({
                        status: false,
                        field: 'email',
                        message: 'El correo ya está en uso'
                    });
                }

                if (updateData.nick && userIsset.nick === updateData.nick.toLowerCase()) {
                    return res.status(409).json({
                        status: false,
                        field: 'nick',
                        message: 'El nick ya está en uso'
                    });
                }

                return res.status(409).json({
                    status: false,
                    message: 'El usuario ya existe'
                });
            }
        }

        if (updateData.email) updateData.email = updateData.email.toLowerCase();
        if (updateData.nick) updateData.nick = updateData.nick.toLowerCase();

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        const userUpdated = await User.findByIdAndUpdate(
            userId,
            updateData,
            { returnDocument: 'after' }
        ).select('-password');

        return res.status(200).json({
            status: true,
            message: 'Usuario actualizado correctamente',
            user: userUpdated
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

const fs = require('fs');
const path = require('path');

userController.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.sub;

        if (!req.file) {
            return res.status(400).json({
                status: false,
                message: 'No se ha subido ninguna imagen'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'Usuario no encontrado'
            });
        }

        if (user.image && user.image.startsWith('http')) {
            const publicId = user.image.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId).catch(() => {});
        }

        const resultado = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'cookee/avatars', transformation: [{ width: 300, height: 300, crop: 'fill' }] },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        const userUpdated = await User.findByIdAndUpdate(
            userId,
            { image: resultado.secure_url },
            { returnDocument: 'after' }
        ).select('-password');

        return res.status(200).json({
            status: true,
            message: 'Avatar actualizado correctamente',
            file: resultado.secure_url,
            user: userUpdated
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

userController.getCounters = async (req, res) => {
    try {
        let userId = req.user.sub;
        if (req.params.id) userId = req.params.id;

        const counters = await getCountFollow(userId);

        const likesResult = await Publication.aggregate([
            { $match: { user: new (require('mongoose').Types.ObjectId)(userId) } },
            { $project: { likesCount: { $size: '$likes' } } },
            { $group: { _id: null, total: { $sum: '$likesCount' } } }
        ]);

        const totalLikes = likesResult[0]?.total ?? 0;

        return res.status(200).json({
            status: true,
            userId,
            following: counters.following,
            followed: counters.followed,
            totalLikes
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

const Follow = require('../models/follow.model');

async function followThisUser(miId, userId) {
    const following = await Follow.findOne({
        user: miId,
        followed: userId
    });

    const followed = await Follow.findOne({
        user: userId,
        followed: miId
    });

    return {
        following: !!following,
        followed: !!followed
    };
}

async function followUserIds(userId) {
    const following = await Follow.find({ user: userId }).select({ followed: 1, _id: 0 });
    const followed = await Follow.find({ followed: userId }).select({ user: 1, _id: 0 });

    const followingIds = following.map(follow => follow.followed.toString());
    const followedIds = followed.map(follow => follow.user.toString());

    return {
        following: followingIds,
        followed: followedIds
    };
}

async function getCountFollow(userId) {
    const following = await Follow.countDocuments({ user: userId });
    const followed = await Follow.countDocuments({ followed: userId });

    return {
        following,
        followed
    };
}

module.exports = userController;
'use strict';

const User = require('../models/user.model');
const Publication = require('../models/publication.model');
const Comment = require('../models/comment.model');
const Follow = require('../models/follow.model');
const adminController = {};

adminController.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPublications = await Publication.countDocuments();
        const totalComments = await Comment.countDocuments();

        const likesResult = await Publication.aggregate([
            { $project: { likesCount: { $size: '$likes' } } },
            { $group: { _id: null, total: { $sum: '$likesCount' } } }
        ]);
        const totalLikes = likesResult[0]?.total ?? 0;

        return res.status(200).json({
            status: true,
            stats: {
                totalUsers,
                totalPublications,
                totalComments,
                totalLikes
            }
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

adminController.getUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 15;
        const search = req.query.search || '';

        const filter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { nick: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
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

        return res.status(200).json({
            status: true,
            users: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

adminController.getUserStats = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ status: false, message: 'Usuario no encontrado' });
        }

        const totalPublications = await Publication.countDocuments({ user: userId });

        const likesResult = await Publication.aggregate([
            { $match: { user: new (require('mongoose').Types.ObjectId)(userId) } },
            { $project: { likesCount: { $size: '$likes' } } },
            { $group: { _id: null, total: { $sum: '$likesCount' } } }
        ]);
        const totalLikes = likesResult[0]?.total ?? 0;

        const totalComments = await Comment.countDocuments({ user: userId });

        const totalFollowers = await Follow.countDocuments({ followed: userId });
        const totalFollowing = await Follow.countDocuments({ user: userId });

        return res.status(200).json({
            status: true,
            user,
            stats: {
                totalPublications,
                totalLikes,
                totalComments,
                totalFollowers,
                totalFollowing
            }
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

adminController.updateRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        const validRoles = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_VERIFIED'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                status: false,
                message: 'Rol no válido'
            });
        }

        if (userId === req.user.sub) {
            return res.status(400).json({
                status: false,
                message: 'No puedes cambiar tu propio rol'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ status: false, message: 'Usuario no encontrado' });
        }

        return res.status(200).json({
            status: true,
            message: `Rol actualizado a ${role}`,
            user
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

adminController.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (userId === req.user.sub) {
            return res.status(400).json({
                status: false,
                message: 'No puedes eliminar tu propia cuenta desde el panel admin'
            });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: 'Usuario no encontrado' });
        }

        await Publication.deleteMany({ user: userId });
        await Comment.deleteMany({ user: userId });
        await Follow.deleteMany({ $or: [{ user: userId }, { followed: userId }] });

        return res.status(200).json({
            status: true,
            message: 'Usuario y su contenido eliminados correctamente'
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = adminController;
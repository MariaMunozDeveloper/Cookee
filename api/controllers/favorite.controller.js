'use strict';

const Favorite = require('../models/favorite.model');
const favoriteController = {};

favoriteController.save = async (req, res) => {
    try {
        const userId = req.user.sub;
        const publicationId = req.params.id;

        const yaExiste = await Favorite.findOne({
            user: userId,
            publication: publicationId
        });

        if (yaExiste) {
            return res.status(409).json({
                status: false,
                message: 'Esta receta ya está en tus favoritos'
            });
        }

        const favorite = new Favorite({
            user: userId,
            publication: publicationId
        });

        const favoriteGuardado = await favorite.save();

        return res.status(201).json({
            status: true,
            message: 'Receta añadida a favoritos',
            favorite: favoriteGuardado
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

favoriteController.delete = async (req, res) => {
    try {
        const userId = req.user.sub;
        const publicationId = req.params.id;

        const deleted = await Favorite.findOneAndDelete({
            user: userId,
            publication: publicationId
        });

        if (!deleted) {
            return res.status(404).json({
                status: false,
                message: 'Favorito no encontrado'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Receta eliminada de favoritos'
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

favoriteController.getMyFavorites = async (req, res) => {
    try {
        const userId = req.user.sub;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 12;
        const skip = (page - 1) * limit;

        const total = await Favorite.countDocuments({ user: userId });
        const favorites = await Favorite.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'publication',
                populate: { path: 'user', select: '-password' }
            });

        const publications = favorites
            .map(f => f.publication)
            .filter(Boolean);

        return res.status(200).json({
            status: true,
            publications,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

favoriteController.checkFavorites = async (req, res) => {
    try {
        const userId = req.user.sub;

        const favorites = await Favorite.find({ user: userId }).select('publication');
        const publicationIds = favorites.map(f => f.publication.toString());

        return res.status(200).json({
            status: true,
            favorites: publicationIds
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = favoriteController;
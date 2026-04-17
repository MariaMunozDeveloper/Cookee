'use strict';

const Comment = require('../models/comment.model');
const commentController = {};

commentController.save = async (req, res) => {
    try {
        const { text } = req.body;
        const publicationId = req.params.id;

        if (!text || !text.trim()) {
            return res.status(400).json({ status: false, message: 'El comentario no puede estar vacío' });
        }

        const comment = new Comment({
            text,
            user: req.user.sub,
            publication: publicationId
        });

        const saved = await comment.save();
        await saved.populate('user', '-password');

        return res.status(201).json({ status: true, comment: saved });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

commentController.getByPublication = async (req, res) => {
    try {
        const publicationId = req.params.id;

        const comments = await Comment.find({ publication: publicationId })
            .populate('user', '-password')
            .sort({ createdAt: -1 });

        return res.status(200).json({ status: true, comments });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

commentController.remove = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.sub;

        const deleted = await Comment.findOneAndDelete({ _id: commentId, user: userId });

        if (!deleted) {
            return res.status(404).json({ status: false, message: 'Comentario no encontrado o sin permiso' });
        }

        return res.status(200).json({ status: true, message: 'Comentario eliminado' });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = commentController;
'use strict';

const Message = require('../models/message.model');
const messageController = {};

messageController.save = async (req, res) => {
    try {
        const { text, receiver } = req.body;

        if (!text || !receiver) {
            return res.status(400).json({
                status: false,
                message: 'Faltan campos obligatorios'
            });
        }

        const message = new Message({
            text,
            receiver,
            emitter: req.user.sub
        });

        const saved = await message.save();

        return res.status(201).json({
            status: true,
            message: 'Mensaje enviado',
            data: saved
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

messageController.getSent = async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const limit = 10;

        const result = await Message.paginate(
            { emitter: req.user.sub },
            {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: [
                    { path: 'emitter', select: '-password' },
                    { path: 'receiver', select: '-password' }
                ]
            }
        );

        return res.status(200).json({
            status: true,
            messages: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

messageController.getReceived = async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const limit = 10;

        const result = await Message.paginate(
            { receiver: req.user.sub },
            {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: [
                    { path: 'emitter', select: '-password' },
                    { path: 'receiver', select: '-password' }
                ]
            }
        );

        // marcar como vistos
        await Message.updateMany(
            { receiver: req.user.sub, viewed: false },
            { viewed: true }
        );

        return res.status(200).json({
            status: true,
            messages: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

messageController.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user.sub,
            viewed: false
        });

        return res.status(200).json({ status: true, count });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

messageController.remove = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.sub;

        const deleted = await Message.findOneAndDelete({
            _id: messageId,
            $or: [{ receiver: userId }, { emitter: userId }]
        });

        if (!deleted) {
            return res.status(404).json({ status: false, message: 'Mensaje no encontrado' });
        }

        return res.status(200).json({ status: true, message: 'Mensaje eliminado' });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = messageController;
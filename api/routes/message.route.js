'use strict';

const express = require('express');
const router = express.Router();

const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middlewares/authenticated');

router.post('/send', authMiddleware.ensureAuth, messageController.save);
router.get('/sent/:page', authMiddleware.ensureAuth, messageController.getSent);
router.get('/received/:page', authMiddleware.ensureAuth, messageController.getReceived);
router.get('/unread-count', authMiddleware.ensureAuth, messageController.getUnreadCount);
router.delete('/:id', authMiddleware.ensureAuth, messageController.remove);

module.exports = router;
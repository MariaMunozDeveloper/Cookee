'use strict';

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/authenticated');

router.post('/:id', authMiddleware.ensureAuth, commentController.save);
router.get('/:id', authMiddleware.ensureAuth, commentController.getByPublication);
router.delete('/:id', authMiddleware.ensureAuth, commentController.remove);

module.exports = router;
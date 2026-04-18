'use strict';

const express = require('express');
const router = express.Router();

const favoriteController = require('../controllers/favorite.controller');
const authMiddleware = require('../middlewares/authenticated');

router.post('/:id', authMiddleware.ensureAuth, favoriteController.save);
router.delete('/:id', authMiddleware.ensureAuth, favoriteController.delete);
router.get('/my-favorites', authMiddleware.ensureAuth, favoriteController.getMyFavorites);
router.get('/check', authMiddleware.ensureAuth, favoriteController.checkFavorites);

module.exports = router;
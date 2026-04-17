'use strict';

const express = require('express');
const router = express.Router();

const followController = require('../controllers/follow.controller');
const authMiddleware = require('../middlewares/authenticated');

router.post('/', authMiddleware.ensureAuth, followController.saveFollow);
router.delete('/:id', authMiddleware.ensureAuth, followController.deleteFollow);
router.get('/following', authMiddleware.ensureAuth, followController.getFollowingUsers);
router.get('/following/:id', authMiddleware.ensureAuth, followController.getFollowingUsers);
router.get('/followers', authMiddleware.ensureAuth, followController.getFollowedUsers);
router.get('/followers/:id', authMiddleware.ensureAuth, followController.getFollowedUsers);
router.get('/my-follows', authMiddleware.ensureAuth, followController.getMyFollows);
router.get('/your-follows', authMiddleware.ensureAuth, followController.getYourFollows);


module.exports = router;

'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/authenticated');
const uploadMiddleware = require('../middlewares/upload');

router.get('/home', userController.home);
router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/profile', authMiddleware.ensureAuth, userController.profile);
router.put('/update', authMiddleware.ensureAuth, userController.updateUser);
router.get('/', authMiddleware.ensureAuth, userController.listUsers);
router.get('/user/:id', authMiddleware.ensureAuth, userController.getUserById);
router.post('/upload-avatar', authMiddleware.ensureAuth, uploadMiddleware.single('avatar'), userController.uploadAvatar);
router.get('/counters', authMiddleware.ensureAuth, userController.getCounters);
router.get('/counters/:id', authMiddleware.ensureAuth, userController.getCounters);


module.exports = router;
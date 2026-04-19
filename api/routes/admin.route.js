'use strict';

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/authenticated');
const adminMiddleware = require('../middlewares/admin.middleware');

const auth = [authMiddleware.ensureAuth, adminMiddleware.ensureAdmin];

router.get('/stats', auth, adminController.getStats);
router.get('/users', auth, adminController.getUsers);
router.get('/users/:id', auth, adminController.getUserStats);
router.put('/users/:id/role', auth, adminController.updateRole);
router.delete('/users/:id', auth, adminController.deleteUser);

module.exports = router;
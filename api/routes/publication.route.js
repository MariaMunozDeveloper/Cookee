'use strict';

const express = require('express');
const router = express.Router();

const PublicationController = require('../controllers/publication.controller');
const authMiddleware = require('../middlewares/authenticated');
const uploadPublication = require('../middlewares/uploadPublication');

router.post('/save', authMiddleware.ensureAuth, PublicationController.save);
router.get('/feed/:page', authMiddleware.ensureAuth, PublicationController.feed);
router.get('/explore', PublicationController.explore);
router.put('/update/:id', authMiddleware.ensureAuth, PublicationController.update);
router.get('/detail/:id', PublicationController.getPublicationById);
router.delete('/remove/:id', authMiddleware.ensureAuth, PublicationController.remove);
router.post('/upload/:id', [authMiddleware.ensureAuth, uploadPublication.single('file0')], PublicationController.upload);
router.post('/upload-step/:id/:stepIndex', [authMiddleware.ensureAuth, uploadPublication.single('file0')], PublicationController.uploadStepImage);
router.get('/user/:id/:page', authMiddleware.ensureAuth, PublicationController.getByUser);
router.post('/like/:id', authMiddleware.ensureAuth, PublicationController.toggleLike);
router.get('/count', authMiddleware.ensureAuth, PublicationController.getCounters);
router.get('/count/:id', authMiddleware.ensureAuth, PublicationController.getCounters);

module.exports = router;
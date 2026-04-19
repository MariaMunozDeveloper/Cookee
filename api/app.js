'use strict';

const express = require('express');
const path = require('path');
const cors = require('cors');
const serveStatic = require('serve-static');

const app = express();

const userRoutes = require('./routes/user.route');
const followRoutes = require('./routes/follow.route');
const publicationRoutes = require('./routes/publication.route');
const messageRoutes = require('./routes/message.route');
const commentRoutes = require('./routes/comment.route');
const favoriteRoutes = require('./routes/favorite.route');
const adminRoutes = require('./routes/admin.route');



app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//comunicación entre frontend y backend (Node), xq se ejecutan en distintos orígenes
app.use(cors());


// hacer pública la carpeta uploads
app.use('/uploads', serveStatic(path.join(__dirname, 'uploads')));


// rutas
app.use('/api/user', userRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/publication', publicationRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
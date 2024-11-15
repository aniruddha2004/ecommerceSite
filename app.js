// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const path = require('path');
const dbConfig = require('./config/db');

// Initialize app
const app = express();

// Connect to MongoDB
dbConfig();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setting up Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Routes
app.use('/', require('./routes/userRoutes'));

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

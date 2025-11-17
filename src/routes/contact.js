// routes/contact.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact');

router.post('/contact', contactController.contactUs);

module.exports = router;
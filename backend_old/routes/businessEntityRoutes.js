const express = require('express');
const router = express.Router();
const businessEntityController = require('../controllers/businessEntityController');

router.get('/businessentity/:id', businessEntityController.getBusinessEntity);

module.exports = router;
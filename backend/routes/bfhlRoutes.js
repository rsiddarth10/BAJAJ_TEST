/**
 * Routes for BFHL API.
 */

const express = require('express');
const router = express.Router();
const { handleBfhl } = require('../controllers/bfhlController');

router.post('/bfhl', handleBfhl);

module.exports = router;

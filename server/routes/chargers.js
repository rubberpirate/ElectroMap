const express = require('express');

const {
  getChargersByStation,
  updateChargerStatus,
} = require('../controllers/chargerController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/station/:stationId', getChargersByStation);
router.put('/:id/status', optionalAuth, updateChargerStatus);

module.exports = router;

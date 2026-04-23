const express = require('express');
const multer = require('multer');

const {
  getNearbyStations,
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  searchStations,
  saveStation,
  unsaveStation,
} = require('../controllers/stationController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 5,
  },
});

router.get('/nearby', optionalAuth, getNearbyStations);
router.get('/search', optionalAuth, searchStations);
router.get('/', optionalAuth, getAllStations);
router.get('/:id', optionalAuth, getStationById);
router.post('/', protect, adminOnly, upload.array('images', 5), createStation);
router.put('/:id', protect, adminOnly, upload.array('images', 5), updateStation);
router.delete('/:id', protect, adminOnly, deleteStation);
router.post('/:id/save', protect, saveStation);
router.delete('/:id/save', protect, unsaveStation);

module.exports = router;

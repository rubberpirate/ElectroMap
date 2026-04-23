const express = require('express');

const {
	getSavedStations,
	getUserProfile,
	getMyReviews,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/saved-stations', protect, getSavedStations);
router.get('/me/reviews', protect, getMyReviews);
router.get('/profile/:id', protect, getUserProfile);

module.exports = router;

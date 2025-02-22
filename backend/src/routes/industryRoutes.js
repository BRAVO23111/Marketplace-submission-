import express from 'express';
import {
    getProfile,
    updateProfile,
    getCarbonStats,
    recordTransaction,
    getLeaderboard
} from '../controllers/industryController.js';

const router = express.Router();

// Industry profile routes
router.get('/profile/:walletAddress', getProfile);
router.post('/profile/:walletAddress', updateProfile);
router.get('/carbon-stats/:walletAddress', getCarbonStats);
router.post('/transaction', recordTransaction);
router.get('/leaderboard', getLeaderboard);

export default router;

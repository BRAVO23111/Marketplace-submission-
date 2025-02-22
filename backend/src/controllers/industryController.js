import IndustryProfile from '../models/IndustryProfile.js';
import Item from '../models/Item.js';
import { contractFunctions } from '../utils/blockchain.js';

// Get industry profile
export const getProfile = async (req, res) => {
    try {
        const profile = await IndustryProfile.findOne({ walletAddress: req.params.walletAddress });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create or update industry profile
export const updateProfile = async (req, res) => {
    try {
        const profile = await IndustryProfile.findOneAndUpdate(
            { walletAddress: req.params.walletAddress },
            req.body,
            { new: true, upsert: true }
        );
        res.json(profile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get carbon savings statistics
export const getCarbonStats = async (req, res) => {
    try {
        const profile = await IndustryProfile.findOne({ walletAddress: req.params.walletAddress });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Calculate statistics
        const stats = {
            totalCarbonSaved: profile.totalCarbonSaved,
            monthlySavings: [],
            transactionCount: profile.transactionHistory.length,
            averageSavingPerTransaction: profile.totalCarbonSaved / profile.transactionHistory.length || 0
        };

        // Calculate monthly savings for the last 12 months
        const last12Months = profile.transactionHistory.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            acc[monthYear] = (acc[monthYear] || 0) + transaction.carbonSaved;
            return acc;
        }, {});

        // Convert to array and sort by date
        stats.monthlySavings = Object.entries(last12Months)
            .map(([monthYear, savings]) => ({
                monthYear,
                savings
            }))
            .sort((a, b) => {
                const [aMonth, aYear] = a.monthYear.split('/');
                const [bMonth, bYear] = b.monthYear.split('/');
                return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
            });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Record a new transaction and update carbon savings
export const recordTransaction = async (req, res) => {
    try {
        const { buyerAddress, sellerAddress, itemId, carbonSaved } = req.body;

        // Update buyer's profile
        const buyerProfile = await IndustryProfile.findOneAndUpdate(
            { walletAddress: buyerAddress },
            {
                $inc: { totalCarbonSaved: carbonSaved },
                $push: {
                    transactionHistory: {
                        type: 'purchase',
                        itemId,
                        carbonSaved,
                        date: new Date()
                    }
                }
            },
            { new: true, upsert: true }
        );

        // Update seller's profile
        const sellerProfile = await IndustryProfile.findOneAndUpdate(
            { walletAddress: sellerAddress },
            {
                $inc: { totalCarbonSaved: carbonSaved },
                $push: {
                    transactionHistory: {
                        type: 'sale',
                        itemId,
                        carbonSaved,
                        date: new Date()
                    }
                }
            },
            { new: true, upsert: true }
        );

        // Update item status
        await Item.findOneAndUpdate(
            { tokenId: itemId },
            { status: 'sold' }
        );

        res.json({
            buyer: buyerProfile,
            seller: sellerProfile
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get leaderboard of carbon savings
export const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await IndustryProfile.find()
            .sort({ totalCarbonSaved: -1 })
            .limit(10)
            .select('industryName walletAddress totalCarbonSaved');
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

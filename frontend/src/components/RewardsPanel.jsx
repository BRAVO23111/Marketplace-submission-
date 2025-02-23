import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';

const RewardsPanel = () => {
    const [userAddress, setUserAddress] = useState(null);

    // Hardcoded rewards data
    const [rewards] = useState([
        {
            id: 1,
            type: 'Purchase',
            amount: ethers.parseEther('0.5'),
            timestamp: new Date('2025-02-23T10:30:00'),
            description: 'Eco-friendly product purchase'
        },
        {
            id: 2,
            type: 'Sale',
            amount: ethers.parseEther('0.8'),
            timestamp: new Date('2025-02-22T15:45:00'),
            description: 'Sustainable item sold'
        },
        {
            id: 3,
            type: 'Bonus',
            amount: ethers.parseEther('0.3'),
            timestamp: new Date('2025-02-21T09:15:00'),
            description: 'Weekly sustainability bonus'
        }
    ]);

    // Hardcoded achievements data
    const [achievements] = useState([
        {
            id: 1,
            title: 'First Sale',
            description: 'Completed your first sustainable sale',
            date: new Date('2025-02-20'),
            points: 100
        },
        {
            id: 2,
            title: 'Eco Warrior',
            description: 'Saved 100kg of CO2 emissions',
            date: new Date('2025-02-22'),
            points: 250
        },
        {
            id: 3,
            title: 'Community Leader',
            description: 'Helped 10 users in the marketplace',
            date: new Date('2025-02-23'),
            points: 300
        }
    ]);

    // Hardcoded stats data
    const [stats] = useState({
        totalRewards: ethers.parseEther('1.6'),
        totalTransactions: 15,
        sustainabilityScore: 85,
        co2Saved: 150, // in kg
        rank: 'Gold',
        level: 3
    });

    const [loading] = useState(false);
    const [error] = useState(null);

    useEffect(() => {
        const connectWallet = async () => {
            try {
                if (window.ethereum) {
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    setUserAddress(accounts[0]);
                }
            } catch (err) {
                console.error('Failed to connect wallet:', err);
                setError('Please connect your MetaMask wallet');
            }
        };

        connectWallet();
    }, []);

    // Removed fetchRewardsData since we're using hardcoded data

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return ethers.formatEther(amount.toString());
    };

    if (!userAddress) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-400 text-lg mb-4">Please connect your MetaMask wallet to view your rewards</p>
                <button 
                    onClick={() => window.ethereum.request({ method: 'eth_requestAccounts' })}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Connect Wallet
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <p className="text-red-500">{error}</p>
                <button 
                    onClick={fetchRewardsData}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-gray-400 mb-2">Total REUSE Tokens</h3>
                    <p className="text-3xl font-bold text-emerald-500">
                        {stats?.rewardStats?.find(s => s._id === 'total')?.totalAmount || 100}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-gray-400 mb-2">Achievements Completed</h3>
                    <p className="text-3xl font-bold text-blue-500">
                        {stats?.achievementsCompleted || 5}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-gray-400 mb-2">Total Impact</h3>
                    <p className="text-3xl font-bold text-purple-500">
                        {stats?.rewardStats?.reduce((acc, curr) => acc + (curr.totalImpact || 100), 1000)} 1000 kg CO₂
                    </p>
                </motion.div>
            </div>

            {/* Recent Rewards */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-6">Recent Rewards</h2>
                <div className="space-y-4">
                    {rewards.map((reward) => (
                        <motion.div
                            key={reward._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-700/50 rounded-lg p-4"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-emerald-400 font-medium">{reward.description}</h3>
                                    <p className="text-sm text-gray-400">{formatDate(reward.timestamp)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-white">
                                        {formatAmount(reward.amount)} REUSE
                                    </p>
                                    <p className="text-sm text-emerald-400">
                                        Impact: {reward.impactValue} kg CO₂
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-6">Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                        <motion.div
                            key={achievement._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-slate-700/50 rounded-lg p-4 border ${
                                achievement.completed ? 'border-emerald-500/50' : 'border-slate-600'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-medium text-white">
                                    {achievement.description}
                                </h3>
                                <span className={`px-2 py-1 rounded text-sm ${
                                    achievement.completed 
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-slate-600/20 text-slate-400'
                                }`}>
                                    {achievement.completed ? 'Completed' : 'In Progress'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Progress</span>
                                    <span className="text-white">
                                        {achievement.progress} / {achievement.targetValue}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-600/50 rounded-full h-2">
                                    <div 
                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                        style={{ 
                                            width: `${(achievement.progress / achievement.targetValue) * 100}%`
                                        }}
                                    />
                                </div>
                                {achievement.completed && (
                                    <p className="text-sm text-emerald-400">
                                        Reward: {formatAmount(achievement.rewardAmount)} REUSE
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RewardsPanel; 
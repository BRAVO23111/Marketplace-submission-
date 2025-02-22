import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';

const ImpactDashboard = () => {
    const [userMetrics, setUserMetrics] = useState({
        totalSavings: 0,
        totalListed: 0,
        totalSold: 0,
        impactScore: 0,
        monthlyImpact: []
    });
    const [communityMetrics, setCommunityMetrics] = useState({
        totalItems: 0,
        totalSold: 0,
        communityImpact: { totalSavings: 0, totalEmissions: 0 },
        categoryImpact: [],
        activeUsers: 0
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAddress, setUserAddress] = useState(null);

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

    useEffect(() => {
        if (userAddress) {
            fetchData();
        }
    }, [userAddress]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch user metrics
            const userResponse = await fetch(`http://localhost:3000/api/items/impact/user/${userAddress}`);
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user metrics');
            }
            const userData = await userResponse.json();
            setUserMetrics(userData);

            // Fetch community metrics
            const communityResponse = await fetch('http://localhost:3000/api/items/impact/community');
            if (!communityResponse.ok) {
                throw new Error('Failed to fetch community metrics');
            }
            const communityData = await communityResponse.json();
            setCommunityMetrics(communityData);

            // Fetch leaderboard
            const leaderboardResponse = await fetch('http://localhost:3000/api/items/impact/leaderboard');
            if (!leaderboardResponse.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            const leaderboardData = await leaderboardResponse.json();
            setLeaderboard(leaderboardData);

        } catch (err) {
            console.error('Error fetching impact data:', err);
            setError(err.message || 'Failed to load impact data');
        } finally {
            setLoading(false);
        }
    };

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (!userAddress) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-400 text-lg mb-4">Please connect your MetaMask wallet to view your impact</p>
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
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold text-white">Impact Dashboard</h1>
            </div>

            {/* Personal Impact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-gray-400 mb-2">Total CO₂ Saved</h3>
                    <p className="text-3xl font-bold text-emerald-500">
                        {(userMetrics?.totalSavings || 0).toFixed(1)} kg
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-gray-400 mb-2">Items Listed</h3>
                    <p className="text-3xl font-bold text-blue-500">
                        {userMetrics?.totalListed || 0}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-gray-400 mb-2">Items Sold</h3>
                    <p className="text-3xl font-bold text-purple-500">
                        {userMetrics?.totalSold || 0}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-gray-400 mb-2">Impact Score</h3>
                    <p className="text-3xl font-bold text-yellow-500">
                        {(userMetrics?.impactScore || 0).toFixed(1)}
                    </p>
                </motion.div>
            </div>

            {/* Monthly Impact Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
                <h3 className="text-xl font-semibold text-white mb-6">Monthly Impact</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={userMetrics?.monthlyImpact?.map(m => ({
                                month: `${m._id.year}-${m._id.month}`,
                                savings: m.totalSavings || 0
                            })) || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '0.5rem'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="savings"
                                stroke="#10B981"
                                fill="#059669"
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Community Impact and Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Community Impact */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-xl font-semibold text-white mb-6">Community Impact</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Users</span>
                            <span className="text-white font-semibold">
                                {communityMetrics?.activeUsers || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Items Listed</span>
                            <span className="text-white font-semibold">
                                {communityMetrics?.totalItems || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total CO₂ Saved</span>
                            <span className="text-emerald-500 font-semibold">
                                {(communityMetrics?.communityImpact?.totalSavings || 0).toFixed(1)} kg
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Leaderboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-xl font-semibold text-white mb-6">Top Contributors</h3>
                    <div className="space-y-4">
                        {(leaderboard || []).slice(0, 5).map((user, index) => (
                            <div
                                key={user.seller}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                                    </span>
                                    <span className="text-white">
                                        {formatAddress(user.seller)}
                                    </span>
                                </div>
                                <span className="text-emerald-500 font-semibold">
                                    {(user.totalSavings || 0).toFixed(1)} kg
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ImpactDashboard; 
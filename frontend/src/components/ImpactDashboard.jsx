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
    // Hardcoded data for charts
    const monthlyImpactData = [
        { month: 'Jan', savings: 20, items: 2 },
        { month: 'Feb', savings: 35, items: 3 },
        { month: 'Mar', savings: 45, items: 4 },
        { month: 'Apr', savings: 60, items: 5 },
        { month: 'May', savings: 85, items: 7 },
        { month: 'Jun', savings: 110, items: 8 },
        { month: 'Jul', savings: 140, items: 10 }
    ];

    const categoryImpactData = [
        { name: 'Electronics', value: 35, color: '#10B981' },
        { name: 'Clothing', value: 25, color: '#3B82F6' },
        { name: 'Furniture', value: 20, color: '#8B5CF6' },
        { name: 'Books', value: 15, color: '#F59E0B' },
        { name: 'Others', value: 5, color: '#6B7280' }
    ];

    const leaderboardData = [
        { seller: '0x742d...44e', totalSavings: 140, name: 'EcoWarrior' },
        { seller: '0x123...789', totalSavings: 120, name: 'GreenGuardian' },
        { seller: '0x456...012', totalSavings: 95, name: 'EarthProtector' },
        { seller: '0x789...345', totalSavings: 80, name: 'BioDruid' },
        { seller: '0xabc...def', totalSavings: 75, name: 'NatureNinja' }
    ];

    const [userMetrics] = useState({
        totalSavings: 140,
        totalListed: 10,
        totalSold: 7,
        impactScore: 8.5,
        monthlyImpact: monthlyImpactData
    });

    const [communityMetrics] = useState({
        totalItems: 150,
        totalSold: 95,
        communityImpact: { totalSavings: 2500, totalEmissions: 5000 },
        categoryImpact: categoryImpactData,
        activeUsers: 50
    });

    const [loading] = useState(false);
    const [error] = useState(null);
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
                        {(userMetrics?.totalSavings || 140).toFixed(1)}  kg
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
                        {userMetrics?.totalListed || 5}
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
                        {userMetrics?.totalSold || 2}
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
                        {(userMetrics?.impactScore || 10).toFixed(1)}
                    </p>
                </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                                data={monthlyImpactData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '0.5rem'
                                    }}
                                    formatter={(value) => [`${value} kg`, 'CO₂ Saved']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="savings"
                                    stroke="#10B981"
                                    fill="url(#colorSavings)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category Impact Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-xl font-semibold text-white mb-6">Impact by Category</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryImpactData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryImpactData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: '1px solid #374151',
                                        borderRadius: '0.5rem'
                                    }}
                                    formatter={(value) => [`${value}%`, 'Impact Share']}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Activity and Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-800 rounded-xl p-6 border border-slate-700"
                >
                    <h3 className="text-xl font-semibold text-white mb-6">Monthly Activity</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyImpactData}>
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
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                                />
                                <Bar name="Items Listed" dataKey="items" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
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
                        {leaderboardData.map((user, index) => (
                            <div
                                key={user.seller}
                                className="flex items-center justify-between bg-slate-700/30 p-4 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                                    </span>
                                    <div>
                                        <span className="text-white font-medium block">{user.name}</span>
                                        <span className="text-gray-400 text-sm">{user.seller}</span>
                                    </div>
                                </div>
                                <span className="text-emerald-400 font-semibold">
                                    {user.totalSavings.toFixed(1)} kg
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
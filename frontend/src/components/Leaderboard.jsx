import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Leaderboard = () => {
    // Hardcoded leaderboard data
    const [leaderboard] = useState([
        {
            id: 1,
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            name: 'EcoWarrior',
            treesPlanted: 150,
            rank: 1,
            badge: '👑'
        },
        {
            id: 2,
            address: '0x123...789',
            name: 'GreenGuardian',
            treesPlanted: 120,
            rank: 2,
            badge: '🥈'
        },
        {
            id: 3,
            address: '0x456...012',
            name: 'EarthProtector',
            treesPlanted: 95,
            rank: 3,
            badge: '🥉'
        },
        {
            id: 4,
            address: '0x789...345',
            name: 'BioDruid',
            treesPlanted: 80,
            rank: 4
        },
        {
            id: 5,
            address: '0xabc...def',
            name: 'NatureNinja',
            treesPlanted: 75,
            rank: 5
        }
    ]);

    const topThree = leaderboard.slice(0, 3);
    const restOfBoard = leaderboard.slice(3);

    return (
        <div className="h-full bg-slate-900 text-white p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                    <span className="mr-2">🌳</span> Tree Planting Champions
                </h2>
                <p className="text-gray-400">Celebrating our top eco-warriors</p>
            </div>
            
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-12">
                {/* Second Place */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="col-start-1 pt-8"
                >
                    <div className="bg-slate-800/50 rounded-t-lg p-4 border border-gray-300 text-center transform hover:scale-105 transition-transform">
                        <div className="-mt-12 mb-2">
                            <span className="text-4xl">{topThree[1].badge}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-300">{topThree[1].name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{topThree[1].address.slice(0, 6)}...{topThree[1].address.slice(-4)}</p>
                        <p className="text-2xl font-bold text-emerald-400">{topThree[1].treesPlanted}</p>
                        <p className="text-sm text-gray-400">trees planted</p>
                    </div>
                </motion.div>

                {/* First Place */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="col-start-2 -mt-4"
                >
                    <div className="bg-slate-800 rounded-t-lg p-6 border-2 border-yellow-500 text-center transform hover:scale-105 transition-transform shadow-lg shadow-yellow-500/20">
                        <div className="-mt-14 mb-2">
                            <span className="text-5xl">{topThree[0].badge}</span>
                        </div>
                        <h3 className="text-xl font-bold text-yellow-500">{topThree[0].name}</h3>
                        <p className="text-sm text-gray-400 mb-3">{topThree[0].address.slice(0, 6)}...{topThree[0].address.slice(-4)}</p>
                        <p className="text-3xl font-bold text-emerald-400">{topThree[0].treesPlanted}</p>
                        <p className="text-sm text-gray-400">trees planted</p>
                    </div>
                </motion.div>

                {/* Third Place */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="col-start-3 pt-12"
                >
                    <div className="bg-slate-800/50 rounded-t-lg p-4 border border-amber-600 text-center transform hover:scale-105 transition-transform">
                        <div className="-mt-12 mb-2">
                            <span className="text-4xl">{topThree[2].badge}</span>
                        </div>
                        <h3 className="text-lg font-bold text-amber-600">{topThree[2].name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{topThree[2].address.slice(0, 6)}...{topThree[2].address.slice(-4)}</p>
                        <p className="text-2xl font-bold text-emerald-400">{topThree[2].treesPlanted}</p>
                        <p className="text-sm text-gray-400">trees planted</p>
                    </div>
                </motion.div>
            </div>

            {/* Rest of Leaderboard */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Honorable Mentions</h3>
                <div className="space-y-3">
                    {restOfBoard.map((user) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-700/30 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-white font-bold">
                                    {user.rank}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">{user.name}</h3>
                                    <p className="text-gray-400 text-sm">{user.address.slice(0, 6)}...{user.address.slice(-4)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-emerald-400 font-bold">{user.treesPlanted}</span>
                                <span className="text-gray-400">trees</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;

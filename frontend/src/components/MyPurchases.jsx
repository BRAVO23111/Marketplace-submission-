import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';

const MyPurchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, recent, older
    const [sortBy, setSortBy] = useState('date'); // date, price, impact
    const [userAddress, setUserAddress] = useState(null);
    const { user } = useSelector(state => state.auth);

    // Get user's Ethereum address when component mounts
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

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setUserAddress(accounts[0]);
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', (accounts) => {
                    setUserAddress(accounts[0]);
                });
            }
        };
    }, []);

    // Fetch purchases when user or address changes
    useEffect(() => {
        if (user?.uid && userAddress) {
            fetchPurchases();
        }
    }, [user, userAddress]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            if (!user?.uid || !userAddress) {
                throw new Error('Please connect your wallet and sign in');
            }

            // Fetch items where the current user is the buyer
            const response = await fetch(`http://localhost:3000/api/items/buyer/${userAddress}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch purchases');
            }
            
            const data = await response.json();
            console.log('Fetched purchases:', data);
            setPurchases(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching purchases:', err);
            setError(err.message);
            setPurchases([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const filteredPurchases = purchases.filter(purchase => {
        if (filter === 'all') return true;
        const purchaseDate = new Date(purchase.soldAt);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        if (filter === 'recent') return purchaseDate >= thirtyDaysAgo;
        if (filter === 'older') return purchaseDate < thirtyDaysAgo;
        return true;
    });

    const sortedPurchases = [...filteredPurchases].sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(b.soldAt) - new Date(a.soldAt);
            case 'price':
                return parseFloat(b.price) - parseFloat(a.price);
            case 'impact':
                return (b.carbonFootprint?.reuseSavings || 0) - (a.carbonFootprint?.reuseSavings || 0);
            default:
                return 0;
        }
    });

    if (!userAddress) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-400 text-lg mb-4">Please connect your MetaMask wallet to view your purchases</p>
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
                    onClick={fetchPurchases}
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
                <h1 className="text-2xl font-bold text-white">My Purchases</h1>
                
                <div className="flex flex-wrap gap-4">
                    {/* Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Purchases</option>
                        <option value="recent">Last 30 Days</option>
                        <option value="older">Older</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="date">Latest First</option>
                        <option value="price">Highest Price</option>
                        <option value="impact">Highest Impact</option>
                    </select>
                </div>
            </div>

            {/* Purchases Grid */}
            {sortedPurchases.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">No purchases found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedPurchases.map((item) => (
                        <motion.div
                            key={item.tokenId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700"
                        >
                            {/* Image */}
                            {item.image && (
                                <div className="relative h-48">
                                    <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-emerald-600 px-3 py-1 rounded-full text-white text-sm font-medium">
                                        Purchased
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{item.description}</p>

                                {/* Price and Date */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-emerald-500 font-semibold">{item.price} ETH</div>
                                    <div className="text-gray-400 text-sm">
                                        Purchased {formatDate(item.soldAt)}
                                    </div>
                                </div>

                                {/* Environmental Impact */}
                                <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">CO₂ Savings</span>
                                        <span className="text-emerald-400">
                                            {item.carbonFootprint?.reuseSavings.toFixed(1)} kg
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Net Impact</span>
                                        <span className={item.carbonFootprint?.netImpact <= 0 ? "text-emerald-400" : "text-red-400"}>
                                            {item.carbonFootprint?.netImpact.toFixed(1)} kg
                                        </span>
                                    </div>
                                </div>

                                {/* Seller Info */}
                                <div className="border-t border-slate-700 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Seller</span>
                                        <span className="text-white">
                                            {formatAddress(item.seller)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-2">
                                        <span className="text-gray-400">Transaction</span>
                                        <a
                                            href={`https://mumbai.polygonscan.com/tx/${item.transaction?.hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 truncate ml-2"
                                        >
                                            View
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPurchases; 
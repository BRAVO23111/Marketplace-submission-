import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';

const ProductDetails = () => {
    const { tokenId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
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
        fetchProductDetails();
    }, [tokenId]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/items/${tokenId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch product details');
            }
            
            const data = await response.json();
            setProduct(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching product details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        try {
            setPurchaseLoading(true);
            
            if (!window.ethereum) {
                throw new Error("Please install MetaMask!");
            }

            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            const buyerAddress = ethers.getAddress(accounts[0]);

            const response = await fetch(`http://localhost:3000/api/items/${tokenId}/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: 1, buyerAddress })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to initiate purchase');
            }
            
            const purchaseDetails = await response.json();
            const contractAddress = ethers.getAddress(purchaseDetails.contractAddress);
            const valueInWei = purchaseDetails.totalPriceWei ? 
                BigInt(purchaseDetails.totalPriceWei) : 
                ethers.parseUnits(purchaseDetails.price.toString(), 'ether');

            const iface = new ethers.Interface([
                "function buyProduct(uint256 productId, uint256 quantity)"
            ]);

            const encodedData = iface.encodeFunctionData("buyProduct", [
                BigInt(purchaseDetails.productId),
                BigInt(1)
            ]);

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    to: contractAddress,
                    from: buyerAddress,
                    value: ethers.toBeHex(valueInWei),
                    data: encodedData,
                    gas: ethers.toBeHex(350000)
                }],
            });

            const provider = new ethers.BrowserProvider(window.ethereum);
            const receipt = await provider.waitForTransaction(txHash);

            await new Promise(resolve => setTimeout(resolve, 5000));

            const verifyResponse = await fetch(`http://localhost:3000/api/items/${tokenId}/execute-buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionHash: txHash,
                    productId: purchaseDetails.productId,
                    quantity: 1
                })
            });

            const result = await verifyResponse.json();
            if (result.message && result.message.includes('failed')) {
                throw new Error(result.message);
            }

            alert('Purchase successful!');
            fetchProductDetails();

        } catch (err) {
            console.error('Purchase failed:', err);
            alert('Purchase failed: ' + (err.message || 'Unknown error'));
        } finally {
            setPurchaseLoading(false);
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
                    onClick={fetchProductDetails}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-400">Product not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-800">
                        {product.image ? (
                            <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No image available
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Product Details */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                        <p className="text-gray-400">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Price</p>
                            <p className="text-3xl font-bold text-emerald-500">{product.price} ETH</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className={`font-semibold ${
                                product.status === 'listed' ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                                {product.status === 'listed' ? 'Available' : 'Sold'}
                            </p>
                        </div>
                    </div>

                    {/* Environmental Impact */}
                    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-white">Environmental Impact</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm">New Product CO₂</p>
                                <p className="text-lg font-semibold text-red-500">
                                    +{product.carbonFootprint?.newProductEmission.toFixed(1)} kg
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">CO₂ Savings</p>
                                <p className="text-lg font-semibold text-emerald-500">
                                    -{product.carbonFootprint?.reuseSavings.toFixed(1)} kg
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-400 text-sm">Net Impact</p>
                                <p className={`text-lg font-semibold ${
                                    product.carbonFootprint?.netImpact <= 0 ? 'text-emerald-500' : 'text-red-500'
                                }`}>
                                    {product.carbonFootprint?.netImpact.toFixed(1)} kg CO₂
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Seller Information */}
                    <div className="bg-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Seller Information</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Address</span>
                                <span className="text-white">{formatAddress(product.seller)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Listed Date</span>
                                <span className="text-white">{formatDate(product.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Button */}
                    {product.status === 'listed' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePurchase}
                            disabled={purchaseLoading || !userAddress}
                            className={`
                                w-full py-4 px-6 rounded-xl font-semibold text-lg
                                transition-all duration-200 relative overflow-hidden
                                ${purchaseLoading || !userAddress
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                                }
                            `}
                        >
                            {purchaseLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing Purchase...
                                </div>
                            ) : !userAddress ? (
                                'Connect Wallet to Purchase'
                            ) : (
                                'Buy Now'
                            )}
                        </motion.button>
                    )}

                    {/* Transaction Details for Sold Items */}
                    {product.status === 'sold' && product.transaction && (
                        <div className="bg-slate-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Transaction Details</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Buyer</span>
                                    <span className="text-white">{formatAddress(product.buyer)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Sale Date</span>
                                    <span className="text-white">{formatDate(product.soldAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Transaction</span>
                                    <a
                                        href={`https://mumbai.polygonscan.com/tx/${product.transaction.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        View on Polygonscan
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ProductDetails; 
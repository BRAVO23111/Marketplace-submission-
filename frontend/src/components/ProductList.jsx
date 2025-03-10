import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loadingStates, setLoadingStates] = useState({});
    const [error, setError] = useState(null);
    const [totalCO2Saved, setTotalCO2Saved] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/items');
            const data = await response.json();
            setProducts(data);
            
            const totalSaved = data.reduce((acc, product) => {
                return acc + (product.carbonFootprint?.reuseSavings || 0);
            }, 0);
            setTotalCO2Saved(totalSaved);
        } catch (err) {
            setError('Failed to fetch products');
            console.error('Error:', err);
        }
    };

    const getImpactLevel = (reuseSavings) => {
        if (reuseSavings > 15) return { 
            icon: '🌱', 
            text: 'High Impact', 
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-900/10',
            borderColor: 'border-emerald-500'
        };
        if (reuseSavings > 5) return { 
            icon: '🌿', 
            text: 'Medium Impact', 
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-900/5',
            borderColor: 'border-emerald-400'
        };
        return { 
            icon: '🍃', 
            text: 'Low Impact', 
            color: 'text-emerald-300',
            bgColor: 'bg-emerald-900/5',
            borderColor: 'border-emerald-300'
        };
    };

    const handlePurchase = async (tokenId) => {
        try {
            setLoadingStates(prev => ({ ...prev, [tokenId]: true }));
            
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

            const verifyResponse = await fetch(`http://localhost:3000/api/items/execute-buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenId: tokenId,
                    buyer: buyerAddress,
                    transactionHash: txHash
                })
            });

            const result = await verifyResponse.json();
            if (!result.success) {
                throw new Error(result.message || 'Transaction verification failed');
            }

            // Show success message with rewards
            alert(`Purchase successful! You earned ${result.rewards.coins} coins${result.rewards.trees > 0 ? ` and ${result.rewards.trees} trees` : ''}!`);
            fetchProducts();

        } catch (err) {
            console.error('Purchase failed:', err);
            alert('Purchase failed: ' + (err.message || 'Unknown error'));
        } finally {
            setLoadingStates(prev => ({ ...prev, [tokenId]: false }));
        }
    };

    const handleProductClick = (tokenId) => {
        navigate(`/marketplace/product/${tokenId}`);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
                <p className="text-red-600 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Impact Summary */}
            <div className="mb-12">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                <span className="text-3xl">🌍</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Total Community Contribution</h2>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-emerald-400">{totalCO2Saved.toFixed(1)}</span>
                                    <span className="text-lg text-emerald-400/80">kg CO₂</span>
                                    <span className="text-gray-400 ml-1">emissions prevented</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => {
                    const impact = getImpactLevel(product.carbonFootprint?.reuseSavings || 0);
                    return (
                        <div key={product.tokenId} 
                            className="group bg-slate-900 rounded-2xl overflow-hidden transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer relative"
                            onClick={() => handleProductClick(product.tokenId)}
                        >
                            {product.image && (
                                <div className="relative h-64 overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-900/20 group-hover:bg-emerald-900/10 transition-all duration-300 z-10" />
                                    <img 
                                        src={product.image} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className={`absolute top-4 right-4 ${impact.bgColor} px-4 py-2 rounded-full flex items-center gap-2 border ${impact.borderColor} z-20`}>
                                        <span className="text-xl">{impact.icon}</span>
                                        <span className={`${impact.color} font-semibold`}>{impact.text}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="p-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{product.name}</h2>
                                    <p className="text-slate-400 line-clamp-2">{product.description}</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-emerald-500/10">
                                    <h3 className="text-lg font-semibold text-emerald-400 mb-3">Environmental Impact</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">New Product CO₂</span>
                                            <span className="font-medium text-red-400">
                                                +{product.carbonFootprint?.newProductEmission.toFixed(1)} kg
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">CO₂ Savings</span>
                                            <span className="font-medium text-emerald-400">
                                                -{product.carbonFootprint?.reuseSavings.toFixed(1)} kg
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-700">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-white">Net Impact</span>
                                                <span className={`font-bold ${(product.carbonFootprint?.netImpact || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {product.carbonFootprint?.netImpact.toFixed(1)} kg
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {product.price} ETH
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        ID: {product.tokenId}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleProductClick(product.tokenId);
                                    }}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 
                                        bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl`}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductList; 
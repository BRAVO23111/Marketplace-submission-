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
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3000/api/items/${tokenId}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch product: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Product details:', data);
            setProduct(data);
        } catch (err) {
            console.error('Error fetching product details:', err);
            setError(err.message || 'Failed to load product details. Please try again.');
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        try {
            setPurchaseLoading(true);
            
            if (!window.ethereum) {
                throw new Error('MetaMask not installed. Please install MetaMask to make purchases.');
            }

            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No Ethereum accounts found. Please connect your wallet.');
            }
            
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
            
            // Debug log for purchase details
            console.log('Purchase details received:', {
                productId: purchaseDetails.productId,
                contractAddress: purchaseDetails.contractAddress,
                price: purchaseDetails.totalPrice,
                priceWei: purchaseDetails.totalPriceWei
            });
            
            const { contractAddress, methodName, methodParams, totalPriceWei } = purchaseDetails;
            
            // Create a contract instance to estimate gas
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(
                contractAddress,
                ["function buyProduct(uint256 productId, uint256 quantity) payable"],
                provider
            );
            
            // Encode function data
            const iface = new ethers.Interface(["function buyProduct(uint256 productId, uint256 quantity) payable"]);
            const encodedData = iface.encodeFunctionData(methodName, methodParams);
            
            // Parse value to BigInt to ensure proper handling
            const valueInWei = BigInt(totalPriceWei);
            
            // Try to estimate gas first
            let gasLimit;
            try {
                const estimatedGas = await provider.estimateGas({
                    to: contractAddress,
                    from: accounts[0],
                    value: valueInWei.toString(),
                    data: encodedData
                });
                
                // Add 30% buffer to estimated gas
                gasLimit = BigInt(Math.floor(Number(estimatedGas) * 1.3));
                console.log('Estimated gas limit:', gasLimit.toString());
            } catch (gasError) {
                console.warn('Gas estimation failed, using default:', gasError);
                gasLimit = BigInt(500000); // Fallback gas limit
            }

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    to: contractAddress,
                    from: accounts[0],
                    value: ethers.toBeHex(valueInWei),
                    data: encodedData,
                    gas: ethers.toBeHex(gasLimit)
                }],
            });

            const receipt = await provider.waitForTransaction(txHash);

            await new Promise(resolve => setTimeout(resolve, 5000));

            const verifyResponse = await fetch(`http://localhost:3000/api/items/${tokenId}/execute-buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionHash: txHash,
                    productId: purchaseDetails.productId,
                    quantity: 1,
                    buyer: ethers.getAddress(accounts[0]),
                    seller: ethers.getAddress(purchaseDetails.seller)
                })
            });

            if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json();
                console.error('Verification failed:', errorData);
                
                // If the error is related to address validation, try again with skipAddressValidation
                if (errorData.message && errorData.message.includes('Buyer or seller mismatch')) {
                    console.log('Retrying with skipAddressValidation...');
                    
                    const retryResponse = await fetch(`http://localhost:3000/api/items/${tokenId}/execute-buy`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionHash: txHash,
                            productId: purchaseDetails.productId,
                            quantity: 1,
                            skipAddressValidation: true
                        })
                    });
                    
                    if (!retryResponse.ok) {
                        const retryErrorData = await retryResponse.json();
                        throw new Error(retryErrorData.message || 'Failed to verify purchase even with skipAddressValidation');
                    }
                    
                    return await retryResponse.json();
                }
                
                throw new Error(errorData.message || 'Failed to verify purchase');
            }

            const result = await verifyResponse.json();
            if (result.message && result.message.includes('failed')) {
                throw new Error(result.message);
            }

            console.log('Purchase successful:', result);
            alert('Purchase successful!');
            
            // Refresh product details after successful purchase
            await fetchProductDetails();

        } catch (err) {
            console.error('Purchase failed:', err);
            
            // Extract the most useful error message
            let errorMessage = 'Purchase failed. Please try again.';
            
            if (err.message) {
                if (err.message.includes('user rejected transaction')) {
                    errorMessage = 'Transaction was rejected by the user.';
                } else if (err.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds in your wallet to complete this purchase.';
                } else if (err.message.includes('gas required exceeds allowance')) {
                    errorMessage = 'Gas required exceeds allowance. Please increase your gas limit.';
                } else {
                    // Use the error message directly if it exists
                    errorMessage = err.message;
                }
            }
            
            setError(errorMessage);
        } finally {
            setPurchaseLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAddress = (address) => {
        if (!address) return 'Unknown Address';
        try {
            // Try to normalize the address
            const normalizedAddress = ethers.getAddress(address);
            return `${normalizedAddress.substring(0, 6)}...${normalizedAddress.substring(normalizedAddress.length - 4)}`;
        } catch (error) {
            console.warn('Invalid address format:', address, error);
            return 'Invalid Address';
        }
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
                        {product?.image ? (
                            <img 
                                src={product.image} 
                                alt={product?.name}
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
                        <h1 className="text-3xl font-bold text-white mb-2">{product?.name || 'Unnamed Product'}</h1>
                        <p className="text-gray-400">{product?.description || 'No description available'}</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Price</p>
                            <p className="text-3xl font-bold text-emerald-500">{product?.price || 0} ETH</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className={`font-semibold ${
                                product?.status === 'listed' ? 'text-emerald-500' : 
                                product?.status === 'sold' ? 'text-red-500' : 'text-yellow-500'
                            }`}>
                                {product?.status ? product.status.charAt(0).toUpperCase() + product.status.slice(1) : 'Unknown'}
                            </p>
                        </div>
                    </div>

                    {/* Carbon Footprint */}
                    <div className="bg-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Carbon Footprint</h2>
                        {product?.carbonFootprint ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm">New Product CO₂</p>
                                    <p className="text-lg font-semibold text-red-500">
                                        +{product.carbonFootprint.newProductEmission?.toFixed(1) || 0} kg
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Reuse Savings</p>
                                    <p className="text-lg font-semibold text-emerald-500">
                                        -{product.carbonFootprint.reuseSavings?.toFixed(1) || 0} kg
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-400 text-sm">Net Impact</p>
                                    <p className={`text-lg font-semibold ${
                                        (product.carbonFootprint.netImpact || 0) <= 0 ? 'text-emerald-500' : 'text-red-500'
                                    }`}>
                                        {product.carbonFootprint.netImpact?.toFixed(1) || 0} kg CO₂
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">Carbon footprint data not available</p>
                        )}
                    </div>

                    {/* Seller Information */}
                    <div className="bg-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Seller Information</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Address</span>
                                <span className="text-white">{formatAddress(product?.seller)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Listed Date</span>
                                <span className="text-white">{formatDate(product?.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Button */}
                    {product?.status === 'listed' && (
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
                    {product?.status === 'sold' && (
                        <div className="bg-slate-800 rounded-xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Transaction Details</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Buyer</span>
                                    <span className="text-white">{formatAddress(product?.buyer)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Sale Date</span>
                                    <span className="text-white">{product?.soldAt ? formatDate(product.soldAt) : 'Unknown'}</span>
                                </div>
                                {product?.transaction && product.transaction.hash && (
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
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ProductDetails; 
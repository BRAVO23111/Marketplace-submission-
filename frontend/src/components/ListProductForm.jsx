import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ListProductForm = () => {
    const [formData, setFormData] = useState({
        tokenId: '',
        name: '',
        description: '',
        price: '',
        quantity: '1',
        image: '',
        carbonFootprint: {
            newProductEmission: '',
            reuseSavings: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [calculatingEmissions, setCalculatingEmissions] = useState(false);
    const navigate = useNavigate();

    // Debounce function to prevent too many API calls
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    // Calculate emissions when product name changes
    const calculateEmissions = async (productName) => {
        if (!productName) return;

        setCalculatingEmissions(true);
        try {
            const response = await fetch('http://localhost:3000/api/items/calculate-emissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName })
            });

            if (!response.ok) {
                throw new Error('Failed to calculate emissions');
            }

            const data = await response.json();
            setFormData(prev => ({
                ...prev,
                carbonFootprint: {
                    newProductEmission: data["Estimated CO₂ Emissions (kg CO₂e)"],
                    reuseSavings: data["Potential CO₂ Savings (kg CO₂e)"]
                }
            }));
        } catch (error) {
            console.error('Error calculating emissions:', error);
        } finally {
            setCalculatingEmissions(false);
        }
    };

    // Debounced version of calculateEmissions
    const debouncedCalculateEmissions = debounce(calculateEmissions, 500);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'name') {
            // When product name changes, trigger emissions calculation
            debouncedCalculateEmissions(value);
        }

        if (name.startsWith('carbon_')) {
            // Handle carbon footprint fields
            const field = name.replace('carbon_', '');
            setFormData(prev => ({
                ...prev,
                carbonFootprint: {
                    ...prev.carbonFootprint,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const calculateNetImpact = () => {
        const newEmission = parseFloat(formData.carbonFootprint.newProductEmission) || 0;
        const reuseSavings = parseFloat(formData.carbonFootprint.reuseSavings) || 0;
        return newEmission - reuseSavings;
    };

    const getImpactLevel = () => {
        const savings = parseFloat(formData.carbonFootprint.reuseSavings) || 0;
        if (savings > 15) return { icon: '🌱', text: 'High Impact', color: 'text-green-600' };
        if (savings > 5) return { icon: '🌿', text: 'Medium Impact', color: 'text-green-500' };
        return { icon: '🍃', text: 'Low Impact', color: 'text-gray-500' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to list product');
            }

            await response.json();
            alert('Product listed successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error listing product:', error);
            alert('Failed to list product: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const impact = getImpactLevel();

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">List New Product</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Token ID</label>
                                <input
                                    type="text"
                                    name="tokenId"
                                    value={formData.tokenId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter token ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter product name"
                                />
                                {calculatingEmissions && (
                                    <p className="mt-2 text-sm text-blue-600 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Calculating environmental impact...
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Describe your product"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price (ETH)</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                            <input
                                type="url"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                    </div>

                    {/* Environmental Impact Section */}
                    <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-6">Environmental Impact</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Product CO₂ Emission (kg)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="carbon_newProductEmission"
                                        value={formData.carbonFootprint.newProductEmission}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white bg-opacity-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    />
                                    {formData.carbonFootprint.newProductEmission && (
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">✓</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CO₂ Savings from Reuse (kg)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="carbon_reuseSavings"
                                        value={formData.carbonFootprint.reuseSavings}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white bg-opacity-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                    />
                                    {formData.carbonFootprint.reuseSavings && (
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">✓</span>
                                    )}
                                </div>
                            </div>

                            {/* Impact Preview */}
                            <div className="bg-white bg-opacity-50 rounded-lg p-4 mt-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">{impact.icon}</span>
                                    <span className={`font-semibold ${impact.color}`}>
                                        {impact.text}
                                    </span>
                                </div>
                                <p className="text-gray-700">
                                    Net Impact: <span className={`font-bold ${calculateNetImpact() <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {calculateNetImpact().toFixed(1)} kg CO₂
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || calculatingEmissions}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                            loading || calculatingEmissions
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {loading ? 'Listing Product...' : calculatingEmissions ? 'Calculating Impact...' : 'List Product'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ListProductForm; 
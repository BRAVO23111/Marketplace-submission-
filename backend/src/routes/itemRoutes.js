import express from 'express';
import { 
    getItems, 
    getItem, 
    createItem, 
    updateItem, 
    deleteItem, 
    buyItem,
    getTransactionHistory,
    getTransactionDetails,
    getItemsBySeller
} from '../controllers/itemController.js';
import { contractFunctions } from '../utils/blockchain.js';
import Item from '../models/Item.js';
import { ethers } from 'ethers';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Debug middleware for this router
router.use((req, res, next) => {
    console.log('Item Router:', {
        method: req.method,
        path: req.path,
        params: req.params,
        body: req.body
    });
    next();
});

// Address validation middleware
const validateAddress = (req, res, next) => {
    try {
        if (req.params.address) {
            req.params.address = ethers.getAddress(req.params.address);
        }
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid Ethereum address' });
    }
};

// Get all items
router.get('/', getItems);

// Get items by seller (MOVED UP in priority)
router.get('/seller/:address', validateAddress, getItemsBySeller);

// Check balance
router.post('/balance', async (req, res) => {
    try {
        const balance = await contractFunctions.checkBalance(req.body.privateKey);
        res.json({ balance });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get transaction history
router.get('/transactions/:address', getTransactionHistory);

// Get transaction details
router.get('/transaction/:transactionId', getTransactionDetails);

// Buy an item
router.post('/:tokenId/buy', buyItem);

// Get a single item
router.get('/:tokenId', getItem);

// Create a new item
router.post('/', createItem);

// Update an item
router.put('/:tokenId', updateItem);

// Delete an item
router.delete('/:tokenId', deleteItem);

// Transfer REUSE tokens to Marketplace
router.post('/transfer-reuse', async (req, res) => {
    try {
        const { amount, privateKey } = req.body;
        if (!amount || !privateKey) {
            return res.status(400).json({ message: 'Amount and privateKey are required' });
        }
        const result = await contractFunctions.transferReuseTokensToMarketplace(amount, privateKey);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Execute buy transaction
router.post('/:tokenId/execute-buy', async (req, res) => {
    try {
        const { transactionHash, productId, quantity } = req.body;
        const tokenId = req.params.tokenId;
        
        console.log('Execute buy request received:', {
            tokenId,
            productId,
            quantity,
            transactionHash,
            body: req.body
        });

        if (!transactionHash || !productId || !quantity) {
            return res.status(400).json({ 
                message: 'transactionHash, productId, and quantity are required',
                received: { transactionHash, productId, quantity }
            });
        }

        // First check if item exists in our database
        const item = await Item.findOne({ tokenId: tokenId });
        if (!item) {
            return res.status(404).json({ 
                message: 'Item not found in database',
                tokenId: tokenId
            });
        }

        // Get contract instance to verify transaction
        let marketplace;
        try {
            marketplace = await contractFunctions.getContract();
            console.log('Contract instance created successfully');
        } catch (error) {
            console.error('Failed to get contract instance:', error);
            return res.status(500).json({
                message: 'Failed to connect to blockchain',
                error: error.message
            });
        }
        
        // Get transaction receipt first
        let receipt;
        try {
            const provider = marketplace.runner.provider;
            console.log('Fetching transaction receipt for:', transactionHash);
            receipt = await provider.getTransactionReceipt(transactionHash);
            
            if (!receipt) {
                return res.status(400).json({
                    message: 'Transaction not found on blockchain',
                    transactionHash
                });
            }

            console.log('Transaction receipt found:', {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber,
                status: receipt.status,
                from: receipt.from,
                to: receipt.to,
                gasUsed: receipt.gasUsed.toString()
            });
        } catch (error) {
            console.error('Failed to get transaction receipt:', error);
            return res.status(400).json({
                message: 'Failed to verify transaction on blockchain',
                error: error.message,
                transactionHash
            });
        }

        if (!receipt.status) {
            return res.status(400).json({
                message: 'Transaction failed on blockchain',
                transactionHash,
                status: receipt.status
            });
        }

        // Parse transaction logs to find purchase event
        let events;
        try {
            events = receipt.logs.map(log => {
                try {
                    const parsedLog = marketplace.interface.parseLog(log);
                    console.log('Parsed log:', {
                        name: parsedLog.name,
                        args: parsedLog.args
                    });
                    return parsedLog;
                } catch (e) {
                    console.log('Failed to parse log:', e.message);
                    return null;
                }
            }).filter(Boolean);

            console.log('Parsed events:', events.map(e => e.name));
        } catch (error) {
            console.error('Failed to parse transaction logs:', error);
            return res.status(400).json({
                message: 'Failed to parse transaction events',
                error: error.message
            });
        }

        const purchaseEvent = events.find(event => event.name === 'ProductPurchased');
        
        if (!purchaseEvent) {
            return res.status(400).json({
                message: 'No purchase event found in transaction',
                transactionHash,
                foundEvents: events.map(e => e.name)
            });
        }

        console.log('Purchase event found:', {
            name: purchaseEvent.name,
            args: Object.fromEntries(
                Object.entries(purchaseEvent.args).map(([key, value]) => [key, value.toString()])
            )
        });

        // Verify purchase event details
        const eventProductId = purchaseEvent.args.productId.toString();
        if (eventProductId !== productId.toString()) {
            return res.status(400).json({
                message: 'Product ID mismatch in purchase event',
                expected: productId,
                found: eventProductId
            });
        }

        const eventQuantity = purchaseEvent.args.quantity.toString();
        if (eventQuantity !== quantity.toString()) {
            return res.status(400).json({
                message: 'Quantity mismatch in purchase event',
                expected: quantity,
                found: eventQuantity
            });
        }

        // Update item status in database
        try {
            item.status = 'sold';
            item.transaction = {
                hash: transactionHash,
                blockNumber: receipt.blockNumber.toString(),
                events: events.map(event => ({
                    name: event.name,
                    args: Object.fromEntries(
                        Object.entries(event.args).map(([key, value]) => [key, value.toString()])
                    )
                }))
            };
            
            // Add buyer information from the event
            item.buyer = purchaseEvent.args.buyer;
            item.soldAt = new Date();
            item.quantity = 0; // Set remaining quantity to 0
            
            await item.save();
            console.log('Database updated successfully');
        } catch (error) {
            console.error('Failed to update database:', error);
            return res.status(500).json({
                message: 'Failed to update item in database',
                error: error.message
            });
        }

        res.json({
            success: true,
            transaction: {
                hash: transactionHash,
                blockNumber: receipt.blockNumber,
                events: events.map(event => ({
                    name: event.name,
                    args: Object.fromEntries(
                        Object.entries(event.args).map(([key, value]) => [key, value.toString()])
                    )
                }))
            },
            itemStatus: 'sold',
            message: 'Item successfully purchased and marked as sold'
        });
    } catch (error) {
        console.error('Execute buy failed:', {
            error: error.message,
            stack: error.stack,
            tokenId: req.params.tokenId,
            body: req.body
        });
        res.status(500).json({ 
            message: 'Internal server error during purchase verification',
            details: error.message,
            stack: error.stack
        });
    }
});

// Calculate CO2 emissions using Python model
router.post('/calculate-emissions', async (req, res) => {
    try {
        const { productName } = req.body;
        
        if (!productName) {
            return res.status(400).json({ message: 'Product name is required' });
        }

        // Get the absolute path to the project root directory (one level up from backend)
        const projectRoot = path.join(__dirname, '../../../');
        
        // Path to Python script and model directory
        const modelDir = path.join(projectRoot, 'backend/model');
        const pythonScript = path.join(modelDir, 'co2.py');
        
        // Log the paths and check if files exist
        console.log('Model directory:', modelDir);
        console.log('Python script path:', pythonScript);
        console.log('CSV file path:', path.join(modelDir, 'Custom_CO2_Emission_Dataset.csv'));
        
        // Add file existence check
        if (!fs.existsSync(pythonScript)) {
            console.error('Python script not found at:', pythonScript);
            return res.status(500).json({ 
                message: 'CO2 calculation script not found',
                scriptPath: pythonScript
            });
        }

        if (!fs.existsSync(path.join(modelDir, 'Custom_CO2_Emission_Dataset.csv'))) {
            console.error('Dataset not found at:', path.join(modelDir, 'Custom_CO2_Emission_Dataset.csv'));
            return res.status(500).json({ 
                message: 'CO2 emissions dataset not found',
                datasetPath: path.join(modelDir, 'Custom_CO2_Emission_Dataset.csv')
            });
        }
        
        // Spawn Python process with detailed logging, passing the model directory as an argument
        console.log('Executing Python script with product name:', productName);
        const pythonProcess = spawn('python3', [pythonScript, productName, modelDir]);

        let result = '';
        let error = '';

        // Collect data from script
        pythonProcess.stdout.on('data', (data) => {
            console.log('Python script output:', data.toString());
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.log('Python script error output:', data.toString());
            error += data.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            console.log('Python script exited with code:', code);
            
            if (code !== 0) {
                console.error('Python script error:', {
                    code,
                    error,
                    scriptPath: pythonScript,
                    productName
                });
                return res.status(500).json({ 
                    message: 'Failed to calculate emissions',
                    error: error,
                    details: {
                        exitCode: code,
                        scriptPath: pythonScript,
                        productName
                    }
                });
            }

            try {
                console.log('Raw Python output:', result);
                const emissions = JSON.parse(result);
                res.json(emissions);
            } catch (parseError) {
                console.error('Failed to parse Python output:', {
                    parseError,
                    rawOutput: result
                });
                res.status(500).json({ 
                    message: 'Failed to parse emissions data',
                    error: parseError.message,
                    rawOutput: result
                });
            }
        });

    } catch (error) {
        console.error('Error in calculate-emissions route:', {
            error,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ 
            message: 'Server error calculating emissions',
            error: error.message,
            stack: error.stack
        });
    }
});

// Impact Dashboard Routes
router.get('/impact/community', async (req, res) => {
    try {
        const totalItems = await Item.countDocuments();
        const totalSold = await Item.countDocuments({ status: 'sold' });
        const activeUsers = await Item.distinct('seller').length;

        // Calculate total CO2 savings
        const items = await Item.find();
        const communityImpact = items.reduce((acc, item) => {
            acc.totalSavings += item.carbonFootprint?.reuseSavings || 0;
            acc.totalEmissions += item.carbonFootprint?.newProductEmission || 0;
            return acc;
        }, { totalSavings: 0, totalEmissions: 0 });

        // Calculate impact by category
        const categoryImpact = await Item.aggregate([
            {
                $group: {
                    _id: "$name",
                    totalSavings: { 
                        $sum: "$carbonFootprint.reuseSavings" 
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSavings: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalItems,
            totalSold,
            activeUsers,
            communityImpact,
            categoryImpact
        });
    } catch (error) {
        console.error('Error fetching community impact:', error);
        res.status(500).json({ 
            message: 'Failed to fetch community impact data',
            error: error.message 
        });
    }
});

router.get('/impact/user/:address', async (req, res) => {
    try {
        const address = req.params.address;
        
        // Get user's items
        const items = await Item.find({ 
            seller: { $regex: new RegExp(`^${address}$`, 'i') }
        });

        // Calculate total metrics
        const totalSavings = items.reduce((sum, item) => 
            sum + (item.carbonFootprint?.reuseSavings || 0), 0);
        
        const totalListed = items.length;
        const totalSold = items.filter(item => item.status === 'sold').length;

        // Calculate impact score (example formula)
        const impactScore = (totalSavings * 0.6) + (totalListed * 0.2) + (totalSold * 0.2);

        // Get monthly impact data
        const monthlyImpact = await Item.aggregate([
            {
                $match: {
                    seller: { $regex: new RegExp(`^${address}$`, 'i') }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSavings: {
                        $sum: "$carbonFootprint.reuseSavings"
                    },
                    itemsListed: { $sum: 1 },
                    itemsSold: {
                        $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json({
            totalSavings,
            totalListed,
            totalSold,
            impactScore,
            monthlyImpact
        });
    } catch (error) {
        console.error('Error fetching user impact:', error);
        res.status(500).json({ 
            message: 'Failed to fetch user impact data',
            error: error.message 
        });
    }
});

router.get('/impact/leaderboard', async (req, res) => {
    try {
        const leaderboard = await Item.aggregate([
            {
                $group: {
                    _id: "$seller",
                    totalSavings: {
                        $sum: "$carbonFootprint.reuseSavings"
                    },
                    itemsListed: { $sum: 1 },
                    itemsSold: {
                        $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    seller: "$_id",
                    totalSavings: 1,
                    itemsListed: 1,
                    itemsSold: 1,
                    impactScore: {
                        $add: [
                            { $multiply: ["$totalSavings", 0.6] },
                            { $multiply: ["$itemsListed", 0.2] },
                            { $multiply: ["$itemsSold", 0.2] }
                        ]
                    }
                }
            },
            { $sort: { impactScore: -1 } },
            { $limit: 10 }
        ]);

        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ 
            message: 'Failed to fetch leaderboard data',
            error: error.message 
        });
    }
});

// Add the buyer route before the general routes
router.get('/buyer/:address', validateAddress, async (req, res) => {
    try {
        const { address } = req.params;
        const normalizedAddress = ethers.getAddress(address);
        
        console.log(`Fetching purchases for buyer: ${normalizedAddress}`);
        
        const items = await Item.find({ 
            buyer: { 
                $regex: new RegExp(normalizedAddress, 'i') 
            },
            soldAt: { $exists: true }
        }).sort({ soldAt: -1 });
        
        console.log(`Found ${items.length} purchases`);
        
        // Normalize addresses in response
        const normalizedItems = items.map(item => {
            const normalizedItem = item.toObject();
            normalizedItem.seller = ethers.getAddress(item.seller);
            if (item.buyer) {
                normalizedItem.buyer = ethers.getAddress(item.buyer);
            }
            return normalizedItem;
        });
        
        res.json(normalizedItems);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ 
            message: 'Failed to fetch purchases',
            error: error.message 
        });
    }
});

export default router;

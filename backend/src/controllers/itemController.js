import Item from '../models/Item.js';
import { contractFunctions } from '../utils/blockchain.js';
import { ethers } from 'ethers';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const MarketplaceABI = require(path.join(process.cwd(), 'artifacts/contracts/Marketplace.sol/Marketplace.json'));
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://rpc-amoy.polygon.technology");

// Get all items
export const getItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single item
export const getItem = async (req, res) => {
    try {
        const item = await Item.findOne({ tokenId: req.params.tokenId });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Log the full item object for debugging
        console.log('Retrieved item:', {
            _id: item._id,
            tokenId: item.tokenId,
            contractProductId: item.contractProductId,
            transaction: item.transaction,
            fullItem: item.toObject()
        });

        // Create response with all necessary details
        const response = {
            _id: item._id,
            tokenId: item.tokenId,
            name: item.name,
            description: item.description,
            price: item.price,
            seller: item.seller,
            image: item.image,
            contractProductId: item.contractProductId,
            quantity: item.quantity,
            status: item.status,
            transaction: item.transaction,
            createdAt: item.createdAt
        };

        res.json(response);
    } catch (error) {
        console.error('Error in getItem:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create a new item
export const createItem = async (req, res) => {
    let savedDraftItem = null;
    
    try {
        // First, create a draft item in the database
        const draftItem = new Item({
            tokenId: req.body.tokenId,
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            seller: req.body.seller || "0x0000000000000000000000000000000000000000", // Placeholder until we get the actual seller
            image: req.body.image,
            quantity: parseInt(req.body.quantity) || 1,
            status: 'draft', // Start as draft
            carbonFootprint: {
                newProductEmission: parseFloat(req.body.carbonFootprint?.newProductEmission) || 0,
                reuseSavings: parseFloat(req.body.carbonFootprint?.reuseSavings) || 0
            }
            // No transaction field for draft items
        });

        // Save the draft item to get an _id
        savedDraftItem = await draftItem.save();
        console.log('Draft item created:', savedDraftItem._id);

        try {
            // Get the contract instance
            const marketplace = await contractFunctions.getContract();
            
            // Get the signer's address and normalize it
            const seller = ethers.getAddress(await marketplace.runner.getAddress());
            
            // Convert price to Wei
            const price = parseFloat(req.body.price);
            if (isNaN(price) || price <= 0) {
                throw new Error('Price must be a positive number');
            }
            const priceInWei = ethers.parseEther(price.toString());
            const quantity = parseInt(req.body.quantity) || 1;

            console.log('Creating item with data:', {
                ...req.body,
                carbonFootprint: req.body.carbonFootprint
            });

            // Call the contract's listProduct function
            const tx = await marketplace.listProduct(
                req.body.name,
                req.body.description,
                priceInWei,
                quantity
            );

            console.log('Transaction sent:', tx.hash);
            
            // Wait for transaction confirmation
            const receipt = await tx.wait();
            
            // Parse the transaction logs to get the product ID
            const productListedEvent = receipt.logs
                .map(log => {
                    try {
                        return marketplace.interface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(Boolean)
                .find(event => event.name === 'ProductListed');

            if (!productListedEvent) {
                const error = new Error('Failed to get product ID from blockchain event');
                error.savedDraftId = savedDraftItem._id;
                throw error;
            }

            // Get the product ID from the event (first argument)
            const contractProductId = productListedEvent.args[0].toString();

            // Process the transaction receipt
            const processedReceipt = {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber.toString(),
                events: receipt.logs.map(log => {
                    try {
                        const parsedLog = marketplace.interface.parseLog(log);
                        return {
                            name: parsedLog.name,
                            args: Array.from(parsedLog.args).map(arg => 
                                typeof arg === 'bigint' ? arg.toString() : arg
                            )
                        };
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean)
            };

            console.log('Product creation successful:', {
                transactionHash: receipt.hash,
                contractProductId: contractProductId,
                tokenId: req.body.tokenId,
                eventArgs: productListedEvent.args
            });

            // Update the draft item with blockchain information
            savedDraftItem.contractProductId = contractProductId;
            savedDraftItem.seller = seller;
            savedDraftItem.status = 'listed';
            savedDraftItem.transaction = processedReceipt;

            // Save the updated item
            const finalItem = await savedDraftItem.save();
            
            // Log the saved item details
            console.log('Item updated with blockchain data:', {
                _id: finalItem._id,
                tokenId: finalItem.tokenId,
                contractProductId: finalItem.contractProductId,
                carbonFootprint: finalItem.carbonFootprint,
                transactionHash: finalItem.transaction.hash
            });

            // Return the item data with the transaction details
            res.status(201).json({
                ...finalItem.toObject(),
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber.toString()
            });
        } catch (blockchainError) {
            // If blockchain transaction fails, attach the draft item ID to the error
            blockchainError.savedDraftId = savedDraftItem._id;
            throw blockchainError;
        }
    } catch (error) {
        console.error('Error in createItem:', error);
        
        // Check if we have a draft item that needs to be cleaned up
        if (error.savedDraftId) {
            try {
                await Item.findByIdAndDelete(error.savedDraftId);
                console.log(`Cleaned up draft item ${error.savedDraftId} after error`);
            } catch (cleanupError) {
                console.error('Failed to clean up draft item:', cleanupError);
            }
        }
        
        // Determine the appropriate error message and status code
        let statusCode = 400;
        let errorMessage = error.message;
        
        if (error.code === 11000) {
            // Duplicate key error
            statusCode = 409;
            errorMessage = 'An item with this ID already exists';
        } else if (error.name === 'ValidationError') {
            // Mongoose validation error
            statusCode = 422;
            errorMessage = Object.values(error.errors)
                .map(e => e.message)
                .join(', ');
        } else if (error.message.includes('transaction')) {
            // Blockchain transaction error
            statusCode = 502;
            errorMessage = 'Blockchain transaction failed: ' + error.message;
        }
        
        res.status(statusCode).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Buy an item
export const buyItem = async (req, res) => {
    try {
        const { quantity, buyerAddress } = req.body;
        const tokenId = req.params.tokenId;
        
        // Input validation
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        if (!buyerAddress) {
            return res.status(400).json({ message: 'Buyer address is required' });
        }

        // Validate and format the buyer's address
        let formattedBuyerAddress;
        try {
            formattedBuyerAddress = ethers.getAddress(buyerAddress);
        } catch (error) {
            return res.status(400).json({ message: 'Invalid buyer address format' });
        }
        
        // First, get the item from our database
        const item = await Item.findOne({ tokenId: tokenId })
            .select('+contractProductId +transaction');
            
        if (!item) {
            return res.status(404).json({ message: 'Item not found in database' });
        }
        
        if (!item.contractProductId) {
            return res.status(400).json({ message: 'Item does not have a valid contract product ID' });
        }

        if (item.status !== 'listed') {
            return res.status(400).json({ message: 'Item is not available for purchase' });
        }

        const productId = item.contractProductId;
        
        console.log('Buy request received:', {
            databaseTokenId: tokenId,
            contractProductId: productId,
            quantity,
            buyerAddress: formattedBuyerAddress,
            itemDetails: {
                price: item.price,
                seller: item.seller,
                status: item.status
            }
        });

        // Get contract instance
        const marketplace = await contractFunctions.getContract();
        
        // Verify the product exists and is active on the blockchain
        const onchainProduct = await marketplace.products(productId);
        
        console.log('On-chain product details:', {
            id: onchainProduct.id.toString(),
            seller: onchainProduct.seller,
            price: onchainProduct.price.toString(),
            quantity: onchainProduct.quantity.toString(),
            isActive: onchainProduct.isActive
        });

        // Verify that the on-chain product ID matches our database product ID
        if (onchainProduct.id.toString() !== productId) {
            return res.status(400).json({
                message: 'Product ID mismatch',
                databaseId: productId,
                chainId: onchainProduct.id.toString()
            });
        }

        // Verify the product is active
        if (!onchainProduct.isActive) {
            return res.status(400).json({ message: 'Product is not active on the blockchain' });
        }

        // Verify quantity is available
        if (quantity > onchainProduct.quantity.toString()) {
            return res.status(400).json({ 
                message: 'Requested quantity not available',
                available: onchainProduct.quantity.toString(),
                requested: quantity
            });
        }

        // Calculate total price in Wei
        const priceInWei = ethers.parseEther(item.price.toString());
        const totalPriceInWei = priceInWei * BigInt(quantity);

        // Return purchase information for the frontend to execute the transaction
        res.json({
            productId: productId,
            quantity: quantity,
            totalPrice: ethers.formatEther(totalPriceInWei),
            totalPriceWei: totalPriceInWei.toString(),
            seller: onchainProduct.seller,
            contractAddress: MARKETPLACE_ADDRESS,
            methodName: 'buyProduct',
            methodParams: [productId, quantity],
            value: totalPriceInWei.toString(),
            buyerAddress: formattedBuyerAddress // Include the formatted address in the response
        });

    } catch (error) {
        console.error('Purchase preparation failed:', {
            error: error.message,
            code: error.code,
            reason: error.reason,
            data: error.data
        });
        res.status(400).json({ 
            message: error.message,
            details: error.reason || 'Failed to prepare purchase'
        });
    }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
    try {
        const transactions = await contractFunctions.getUserTransactions(req.params.address);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get transaction details
export const getTransactionDetails = async (req, res) => {
    try {
        const details = await contractFunctions.getTransactionDetails(req.params.transactionId);
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an item
export const updateItem = async (req, res) => {
    try {
        const item = await Item.findOne({ tokenId: req.params.tokenId });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Update only the fields that are provided
        const updateFields = ['name', 'description', 'price', 'image'];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                item[field] = req.body[field];
            }
        });

        if (req.body.price) {
            // Update price on blockchain and wait for confirmation
            const txResult = await contractFunctions.updateItemPrice(req.params.tokenId, req.body.price);
            const updatedItem = await item.save();
            
            res.json({
                item: updatedItem,
                transaction: {
                    hash: txResult.transactionHash,
                    events: txResult.events
                }
            });
        } else {
            const updatedItem = await item.save();
            res.json({ item: updatedItem });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an item
export const deleteItem = async (req, res) => {
    try {
        const item = await Item.findOne({ tokenId: req.params.tokenId });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        // Deactivate on blockchain first
        const txResult = await contractFunctions.deactivateItem(req.params.tokenId);
        
        // If blockchain deactivation is successful, remove from database
        await item.deleteOne();
        
        res.json({
            message: 'Item deleted',
            transaction: {
                hash: txResult.transactionHash,
                events: txResult.events
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get items by seller
export const getItemsBySeller = async (req, res) => {
    try {
        const sellerAddress = req.params.address;
        
        console.log('Fetching items for seller:', {
            rawAddress: req.params.address,
            normalizedAddress: sellerAddress
        });

        // Find items for the seller (case-insensitive)
        const items = await Item.find({
            seller: { 
                $regex: new RegExp(`^${sellerAddress}$`, 'i')
            }
        }).sort({ createdAt: -1 });

        console.log('Found items:', {
            count: items.length,
            sellerAddress,
            items: items.map(item => ({
                tokenId: item.tokenId,
                name: item.name,
                status: item.status,
                seller: item.seller
            }))
        });

        // Enhance the response with additional details
        const enhancedItems = items.map(item => {
            const itemObj = item.toObject();
            return {
                ...itemObj,
                netImpact: itemObj.carbonFootprint ? 
                    (itemObj.carbonFootprint.newProductEmission - itemObj.carbonFootprint.reuseSavings) : 0,
                listingDate: itemObj.createdAt,
                saleDate: itemObj.soldAt,
                // Ensure addresses are consistently formatted
                seller: ethers.getAddress(itemObj.seller),
                buyer: itemObj.buyer ? ethers.getAddress(itemObj.buyer) : null
            };
        });

        res.json(enhancedItems);
    } catch (error) {
        console.error('Error in getItemsBySeller:', {
            error: error.message,
            stack: error.stack,
            address: req.params.address
        });
        res.status(500).json({ 
            message: error.message,
            details: 'Failed to fetch seller items'
        });
    }
};
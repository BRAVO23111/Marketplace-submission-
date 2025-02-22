import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const MarketplaceABI = require(path.join(process.cwd(), 'artifacts/contracts/Marketplace.sol/Marketplace.json'));

dotenv.config({ path: path.join(process.cwd(), '.env') });

const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const RPC_URL = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Create provider and signer for server-side operations
let provider;
let signer;

try {
    console.log('Initializing provider with RPC URL:', RPC_URL);
    provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Test the provider connection
    provider.getNetwork().then(network => {
        console.log('Connected to network:', {
            chainId: network.chainId,
            name: network.name
        });
    }).catch(error => {
        console.error('Failed to get network details:', {
            error: error.message,
            code: error.code,
            stack: error.stack
        });
    });

    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('Signer created with address:', signer.address);
} catch (error) {
    console.error('Failed to initialize provider/signer:', {
        error: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack
    });
}

// Gas settings for testing
const TEST_GAS_SETTINGS = {
    maxFeePerGas: ethers.parseUnits('50', 'gwei'),     // Increased to meet network requirements
    maxPriorityFeePerGas: ethers.parseUnits('25', 'gwei'), // Increased to meet minimum needed
    gasLimit: 150000  // Keeping the same gas limit
};

// Event handlers
const transactionHandlers = new Map();

export const contractFunctions = {
    async getContract() {
        try {
            if (!provider || !signer) {
                throw new Error('Provider or signer not initialized');
            }

            // Test provider connection before creating contract
            const network = await provider.getNetwork();
            console.log('Current network:', {
                chainId: network.chainId,
                name: network.name,
                provider: provider.connection?.url || 'unknown'
            });

            const marketplace = new ethers.Contract(
                MARKETPLACE_ADDRESS,
                MarketplaceABI.abi,
                signer
            );

            // Test contract connection
            const isContract = await provider.getCode(MARKETPLACE_ADDRESS);
            if (isContract === '0x') {
                throw new Error('No contract found at specified address');
            }

            return marketplace;
        } catch (error) {
            console.error('Contract initialization failed:', {
                error: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data,
                stack: error.stack,
                marketplace: MARKETPLACE_ADDRESS,
                rpcUrl: RPC_URL
            });
            throw error;
        }
    },

    async getProduct(productId) {
        const marketplace = await this.getContract();
        try {
            const product = await marketplace.products(productId);
            return {
                id: product.id.toString(),
                seller: product.seller,
                name: product.name,
                description: product.description,
                price: product.price,
                quantity: product.quantity,
                isActive: product.isActive
            };
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    async listItem(tokenId, name, description, price, quantity = 1) {
        const marketplace = await this.getContract();
        const priceInWei = ethers.parseEther(price.toString());
        
        try {
            const sellerAddress = await signer.getAddress();
            console.log('Attempting to list item:', {
                tokenId,
                name,
                description,
                priceInWei: priceInWei.toString(),
                quantity,
                seller: sellerAddress
            });

            // Use legacy gas settings for more reliable transactions
            const gasSettings = {
                gasLimit: 200000,
                gasPrice: ethers.parseUnits('50', 'gwei')  // Using a single gas price instead of maxFeePerGas/maxPriorityFeePerGas
            };

            const tx = await marketplace.listProduct(
                name, 
                description, 
                priceInWei, 
                quantity,
                gasSettings
            );

            console.log('Transaction sent:', tx.hash);
            const receipt = await tx.wait();
            return this.parseTransactionReceipt(receipt);
        } catch (error) {
            console.error('Listing failed:', {
                error: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data,
                transaction: error.transaction
            });
            throw error;
        }
    },

    async getProductDetails(productId) {
        const marketplace = await this.getContract();
        const product = await marketplace.products(productId);
        return {
            id: product.id.toString(),
            seller: product.seller,
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            quantity: product.quantity.toString(),
            isActive: product.isActive
        };
    },

    async validatePurchase(productId, tokenId, quantity, buyerPrivateKey) {
        const buyerSigner = new ethers.Wallet(buyerPrivateKey, provider);
        const marketplace = new ethers.Contract(
            MARKETPLACE_ADDRESS,
            MarketplaceABI.abi,
            buyerSigner
        );

        // Check buyer's balance
        const buyerBalance = await provider.getBalance(buyerSigner.address);
        
        // Get product details
        const product = await marketplace.products(productId);
        
        // Validate product exists and is active
        if (!product.isActive) {
            throw new Error('Product is not active in the contract');
        }

        // Validate quantity
        const availableQuantity = product.quantity;
        if (quantity > availableQuantity) {
            throw new Error(`Requested quantity (${quantity}) exceeds available quantity (${availableQuantity})`);
        }

        // Calculate total price
        const totalPriceInWei = product.price * BigInt(quantity);

        // Check if buyer has enough balance
        if (buyerBalance < totalPriceInWei) {
            throw new Error(`Insufficient funds. Required: ${ethers.formatEther(totalPriceInWei)} ETH, Available: ${ethers.formatEther(buyerBalance)} ETH`);
        }

        return {
            product,
            totalPriceInWei,
            buyerBalance,
            buyerAddress: buyerSigner.address
        };
    },

    async estimateGas(productId, quantity, totalPriceInWei, buyerSigner) {
        const marketplace = new ethers.Contract(
            MARKETPLACE_ADDRESS,
            MarketplaceABI.abi,
            buyerSigner
        );

        try {
            // Get current network gas prices
            const feeData = await provider.getFeeData();
            
            // Calculate gas prices with caps
            const maxFeePerGas = feeData.maxFeePerGas 
                ? ethers.min(feeData.maxFeePerGas, ethers.parseUnits('30', 'gwei'))
                : ethers.parseUnits('25', 'gwei');
                
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
                ? ethers.min(feeData.maxPriorityFeePerGas, ethers.parseUnits('5', 'gwei'))
                : ethers.parseUnits('5', 'gwei');

            // Try to estimate gas
            let gasLimit;
            try {
                const estimatedGas = await marketplace.buyProduct.estimateGas(
                    productId,
                    quantity,
                    { value: totalPriceInWei }
                );
                // Use estimation with a small buffer
                gasLimit = estimatedGas * BigInt(110) / BigInt(100);
            } catch {
                // If estimation fails, use a reasonable default
                gasLimit = BigInt(150000);
            }

            // Cap the gas limit
            gasLimit = ethers.min(gasLimit, BigInt(200000));

            console.log('Gas settings:', {
                gasLimit: gasLimit.toString(),
                maxFeePerGas: ethers.formatUnits(maxFeePerGas, 'gwei') + ' gwei',
                maxPriorityFeePerGas: ethers.formatUnits(maxPriorityFeePerGas, 'gwei') + ' gwei'
            });

            return {
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas
            };
        } catch (error) {
            console.error('Gas estimation failed:', error);
            // Return safe minimum values
            return {
                gasLimit: BigInt(150000),
                maxFeePerGas: ethers.parseUnits('25', 'gwei'),
                maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei')
            };
        }
    },

    async buyItem(productId, tokenId, quantity, price, buyerPrivateKey) {
        const buyerSigner = new ethers.Wallet(buyerPrivateKey, provider);
        const marketplace = new ethers.Contract(
            MARKETPLACE_ADDRESS,
            MarketplaceABI.abi,
            buyerSigner
        );
        
        try {
            // Get product details and log them
            const product = await marketplace.products(productId);
            console.log('Product details:', {
                productId,
                isActive: product.isActive,
                price: product.price.toString(),
                quantity: product.quantity.toString(),
                seller: product.seller
            });
            
            if (!product.isActive) {
                throw new Error('Product is not available');
            }

            // Verify the product ID matches
            if (product.id.toString() !== productId) {
                throw new Error(`Product ID mismatch: expected ${productId}, got ${product.id.toString()}`);
            }

            // Get REUSE token contract
            const reuseTokenAddress = await marketplace.reuseToken();
            const reuseTokenABI = [
                "function balanceOf(address account) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "function approve(address spender, uint256 amount) returns (bool)"
            ];
            const reuseToken = new ethers.Contract(reuseTokenAddress, reuseTokenABI, buyerSigner);

            // Check marketplace's REUSE token balance
            const marketplaceReuseBalance = await reuseToken.balanceOf(MARKETPLACE_ADDRESS);
            const requiredTokens = BigInt(quantity) * (BigInt(10) ** BigInt(18)); // quantity * 10^18

            console.log('Token details:', {
                marketplaceAddress: MARKETPLACE_ADDRESS,
                marketplaceReuseBalance: marketplaceReuseBalance.toString(),
                requiredTokens: requiredTokens.toString()
            });

            if (marketplaceReuseBalance < requiredTokens) {
                throw new Error(`Marketplace has insufficient REUSE tokens. Has: ${marketplaceReuseBalance.toString()}, Needs: ${requiredTokens.toString()}`);
            }

            // Calculate price in Wei
            const priceInWei = ethers.parseEther(price.toString());
            const totalPriceInWei = priceInWei * BigInt(quantity);
            
            // Get network state
            const feeData = await provider.getFeeData();
            console.log('Network state:', {
                baseFeePerGas: feeData.lastBaseFeePerGas ? ethers.formatUnits(feeData.lastBaseFeePerGas, 'gwei') + ' gwei' : 'N/A',
                suggestedPriorityFee: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' gwei' : 'N/A'
            });

            // Use minimal gas settings
            const gasSettings = {
                gasLimit: 300000,
                gasPrice: ethers.parseUnits('50', 'gwei')
            };

            // Calculate total cost
            const maxGasCost = BigInt(gasSettings.gasLimit) * gasSettings.gasPrice;
            const totalCost = totalPriceInWei + maxGasCost;

            // Check ETH balance
            const buyerBalance = await provider.getBalance(buyerSigner.address);
            console.log('Transaction details:', {
                buyerAddress: buyerSigner.address,
                buyerBalance: ethers.formatEther(buyerBalance) + ' ETH',
                productPrice: ethers.formatEther(totalPriceInWei) + ' ETH',
                maxGasCost: ethers.formatEther(maxGasCost) + ' ETH',
                totalCost: ethers.formatEther(totalCost) + ' ETH',
                gasPrice: ethers.formatUnits(gasSettings.gasPrice, 'gwei') + ' gwei'
            });

            if (buyerBalance < totalCost) {
                throw new Error(`Insufficient ETH. Need ${ethers.formatEther(totalCost)} ETH, have ${ethers.formatEther(buyerBalance)} ETH`);
            }

            console.log('Attempting purchase with settings:', {
                productId,
                value: ethers.formatEther(totalPriceInWei) + ' ETH',
                gasLimit: gasSettings.gasLimit,
                gasPrice: ethers.formatUnits(gasSettings.gasPrice, 'gwei') + ' gwei'
            });

            // Send transaction with value and gas settings
            const tx = await marketplace.buyProduct(
                productId,
                quantity,
                {
                    value: totalPriceInWei,
                    ...gasSettings
                }
            );

            console.log('Transaction sent:', tx.hash);
            const receipt = await tx.wait();

            return {
                transaction: receipt,
                productDetails: {
                    productId,
                    tokenId,
                    seller: product.seller,
                    price: product.price.toString(),
                    quantity: product.quantity.toString(),
                    buyerAddress: buyerSigner.address,
                    totalPaid: totalPriceInWei.toString()
                }
            };
        } catch (error) {
            console.error('Purchase failed:', {
                error: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data,
                transaction: error.transaction ? {
                    hash: error.transaction.hash,
                    from: error.transaction.from,
                    to: error.transaction.to,
                    data: error.transaction.data
                } : 'No transaction data'
            });
            
            if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds to cover gas costs. Please ensure you have enough ETH for the product price plus gas fees.');
            } else if (error.reason === 'Product is not available') {
                throw new Error('This product is not available for purchase.');
            } else if (error.message.includes('transaction underpriced')) {
                throw new Error('Network is congested. Please try again later.');
            } else if (error.message.includes('Marketplace has insufficient REUSE tokens')) {
                throw new Error(error.message);
            } else {
                throw new Error('Transaction failed: ' + (error.reason || error.message));
            }
        }
    },

    enhanceError(error) {
        // Enhance error messages with more context
        if (error.reason) {
            switch (error.reason) {
                case 'Product is not available':
                    return new Error('Product is not available or has been deactivated');
                case 'Invalid quantity':
                    return new Error('Requested quantity is invalid or exceeds available stock');
                case 'Insufficient funds':
                    return new Error('Insufficient funds to complete the purchase');
                default:
                    return new Error(`Contract error: ${error.reason}`);
            }
        }
        
        if (error.message.includes('transaction underpriced')) {
            return new Error('Transaction failed due to network congestion. Please try again.');
        }

        return error;
    },

    async deactivateItem(tokenId) {
        const marketplace = await this.getContract();
        const tx = await marketplace.deactivateProduct(tokenId, TEST_GAS_SETTINGS);
        return this.waitForTransaction(tx);
    },

    async waitForTransaction(tx) {
        try {
            const receipt = await tx.wait();
            return this.parseTransactionReceipt(receipt);
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    },

    async parseTransactionReceipt(receipt) {
        const marketplace = await this.getContract();
        const events = receipt.logs.map(log => {
            try {
                return marketplace.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        // Convert BigInt values to strings in event arguments
        const processValue = (value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            if (Array.isArray(value)) {
                return value.map(processValue);
            }
            if (value && typeof value === 'object') {
                const processed = {};
                for (const key in value) {
                    processed[key] = processValue(value[key]);
                }
                return processed;
            }
            return value;
        };

        const result = {
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber.toString(),
            events: events.map(event => ({
                name: event.name,
                args: processValue(event.args)
            }))
        };

        // Notify registered handlers
        events.forEach(event => {
            const handlers = transactionHandlers.get(event.name) || [];
            handlers.forEach(handler => handler(event.args));
        });

        return result;
    },

    // Transaction verification methods
    async getTransactionDetails(transactionId) {
        const marketplace = await this.getContract();
        const details = await marketplace.getTransaction(transactionId);
        return {
            productId: details[0].toString(),
            buyer: details[1],
            seller: details[2],
            quantity: details[3].toString(),
            totalPrice: details[4].toString(),
            timestamp: new Date(Number(details[5]) * 1000),
            status: ['Pending', 'Completed', 'Cancelled'][Number(details[6])]
        };
    },

    async getUserTransactions(userAddress) {
        const marketplace = await this.getContract();
        const transactionIds = await marketplace.getUserTransactions(userAddress);
        return Promise.all(
            transactionIds.map(id => this.getTransactionDetails(id))
        );
    },

    // Event subscription methods
    onTransactionEvent(eventName, handler) {
        if (!transactionHandlers.has(eventName)) {
            transactionHandlers.set(eventName, []);
        }
        transactionHandlers.get(eventName).push(handler);
    },

    removeTransactionHandler(eventName, handler) {
        if (transactionHandlers.has(eventName)) {
            const handlers = transactionHandlers.get(eventName);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    },

    async checkBalance(privateKey) {
        const wallet = new ethers.Wallet(privateKey, provider);
        const balance = await provider.getBalance(wallet.address);
        return ethers.formatEther(balance);
    },

    async transferReuseTokensToMarketplace(amount, privateKey) {
        const tokenSigner = new ethers.Wallet(privateKey, provider);
        
        try {
            const marketplace = await this.getContract();
            const reuseTokenAddress = await marketplace.reuseToken();
            console.log('REUSE token address:', reuseTokenAddress);

            const reuseTokenABI = [
                "function balanceOf(address account) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)",
                "function approve(address spender, uint256 amount) returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)"
            ];
            const reuseToken = new ethers.Contract(reuseTokenAddress, reuseTokenABI, tokenSigner);

            // Convert amount to tokens (1 token = 10^18 units)
            const tokenAmount = BigInt(amount) * (BigInt(10) ** BigInt(18));

            // Check sender's balance
            const senderBalance = await reuseToken.balanceOf(tokenSigner.address);
            console.log('Sender balance:', senderBalance.toString());

            if (senderBalance < tokenAmount) {
                throw new Error(`Insufficient REUSE tokens. Have: ${senderBalance.toString()}, Need: ${tokenAmount.toString()}`);
            }

            // Check current allowance
            const currentAllowance = await reuseToken.allowance(tokenSigner.address, MARKETPLACE_ADDRESS);
            console.log('Current allowance:', currentAllowance.toString());

            // Approve if needed
            if (currentAllowance < tokenAmount) {
                console.log('Approving tokens...');
                const approveTx = await reuseToken.approve(MARKETPLACE_ADDRESS, tokenAmount, {
                    gasLimit: 100000,
                    gasPrice: ethers.parseUnits('50', 'gwei')
                });
                await approveTx.wait();
                console.log('Tokens approved');
            }

            console.log('Transferring REUSE tokens:', {
                from: tokenSigner.address,
                to: MARKETPLACE_ADDRESS,
                amount: tokenAmount.toString()
            });

            // Transfer tokens to marketplace
            const tx = await reuseToken.transfer(MARKETPLACE_ADDRESS, tokenAmount, {
                gasLimit: 100000,
                gasPrice: ethers.parseUnits('50', 'gwei')
            });
            const receipt = await tx.wait();

            // Get updated balance
            const newBalance = await reuseToken.balanceOf(MARKETPLACE_ADDRESS);

            return {
                transaction: receipt,
                newMarketplaceBalance: newBalance.toString()
            };
        } catch (error) {
            console.error('Token transfer failed:', error);
            throw error;
        }
    },

    // Add new verification function
    async verifyPurchaseTransaction(transactionHash, productId, tokenId, quantity) {
        console.log('Starting transaction verification:', {
            transactionHash,
            productId,
            tokenId,
            quantity,
            marketplace: MARKETPLACE_ADDRESS
        });

        try {
            // Test provider connection
            try {
                const network = await provider.getNetwork();
                console.log('Network connection verified:', {
                    chainId: network.chainId,
                    name: network.name
                });
            } catch (error) {
                console.error('Provider connection failed:', {
                    error: error.message,
                    code: error.code,
                    provider: provider.connection?.url
                });
                throw new Error('Failed to connect to blockchain network');
            }

            // Get transaction receipt
            console.log('Fetching transaction receipt...');
            const receipt = await provider.getTransactionReceipt(transactionHash);
            if (!receipt) {
                console.error('Transaction receipt not found:', { transactionHash });
                throw new Error('Transaction not found or not confirmed');
            }

            console.log('Transaction receipt found:', {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber,
                status: receipt.status,
                from: receipt.from,
                to: receipt.to,
                gasUsed: receipt.gasUsed.toString()
            });

            // Get contract instance
            const marketplace = await this.getContract();
            
            // Parse transaction logs
            console.log('Parsing transaction logs...');
            const events = receipt.logs.map(log => {
                try {
                    const parsedLog = marketplace.interface.parseLog(log);
                    console.log('Parsed log:', {
                        name: parsedLog.name,
                        args: Object.fromEntries(
                            Object.entries(parsedLog.args).map(([key, value]) => [key, value.toString()])
                        )
                    });
                    return parsedLog;
                } catch (e) {
                    console.log('Failed to parse log:', {
                        error: e.message,
                        log: log
                    });
                    return null;
                }
            }).filter(Boolean);

            // Find ProductPurchased event
            const purchaseEvent = events.find(event => event.name === 'ProductPurchased');
            if (!purchaseEvent) {
                console.error('Purchase event not found:', {
                    foundEvents: events.map(e => e.name)
                });
                throw new Error('No purchase event found in transaction');
            }

            console.log('Purchase event details:', {
                name: purchaseEvent.name,
                args: Object.fromEntries(
                    Object.entries(purchaseEvent.args).map(([key, value]) => [key, value.toString()])
                )
            });

            // Verify product details
            if (purchaseEvent.args.productId.toString() !== productId) {
                console.error('Product ID mismatch:', {
                    expected: productId,
                    found: purchaseEvent.args.productId.toString()
                });
                throw new Error('Product ID mismatch in transaction');
            }

            if (purchaseEvent.args.quantity.toString() !== quantity.toString()) {
                console.error('Quantity mismatch:', {
                    expected: quantity,
                    found: purchaseEvent.args.quantity.toString()
                });
                throw new Error('Quantity mismatch in transaction');
            }

            // Get product details to verify
            console.log('Fetching current product state...');
            const product = await marketplace.products(productId);
            console.log('Product state:', {
                id: product.id.toString(),
                isActive: product.isActive,
                quantity: product.quantity.toString()
            });

            // Return verified transaction details
            const verifiedDetails = {
                blockNumber: receipt.blockNumber,
                events: events.map(event => ({
                    name: event.name,
                    args: Array.from(event.args).map(arg => 
                        typeof arg === 'bigint' ? arg.toString() : arg
                    )
                })),
                buyer: purchaseEvent.args.buyer,
                seller: purchaseEvent.args.seller,
                totalPrice: purchaseEvent.args.totalPrice.toString(),
                timestamp: purchaseEvent.args.timestamp.toString()
            };

            console.log('Verification completed successfully:', verifiedDetails);
            return verifiedDetails;

        } catch (error) {
            console.error('Transaction verification failed:', {
                error: error.message,
                code: error.code,
                reason: error.reason,
                data: error.data,
                stack: error.stack,
                transactionHash,
                productId,
                tokenId
            });
            throw new Error(`Failed to verify transaction: ${error.message}`);
        }
    },
};

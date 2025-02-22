const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Read the full ABI from the contract artifacts
const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'Marketplace.sol', 'Marketplace.json');
const MarketplaceArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const MARKETPLACE_ADDRESS = '0xCC57Ffe7b7996453c90a34C77Ef4E742d7cDbbE3';
const BUYER_PRIVATE_KEY = '0x214d3478ce7ea6cf03e56611bb9c0880a3e9930d8d6f1ec619f6e32c2dce7c8c';
const PRODUCT_ID = '6';
const QUANTITY = 1;
const PRICE_IN_WEI = '100000000000000'; // 0.0001 ETH

async function executePurchase() {
    try {
        // Connect to the network
        const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
        
        // Create wallet instance
        const wallet = new ethers.Wallet(BUYER_PRIVATE_KEY, provider);
        
        // Create contract instance with full ABI
        const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MarketplaceArtifact.abi, wallet);

        // First check if the product exists and is active
        const product = await contract.products(PRODUCT_ID);
        console.log('\nProduct Details:');
        console.log('-------------------------');
        console.log('Product ID:', product.id.toString());
        console.log('Seller:', product.seller);
        console.log('Name:', product.name);
        console.log('Price:', ethers.formatEther(product.price), 'ETH');
        console.log('Quantity Available:', product.quantity.toString());
        console.log('Is Active:', product.isActive);

        if (!product.isActive) {
            throw new Error('Product is not active');
        }

        if (product.quantity.toString() === '0') {
            throw new Error('Product is out of stock');
        }

        // Check REUSE token balance
        const reuseTokenAddress = await contract.reuseToken();
        const reuseTokenABI = ["function balanceOf(address) view returns (uint256)"];
        const reuseToken = new ethers.Contract(reuseTokenAddress, reuseTokenABI, provider);
        const marketplaceReuseBalance = await reuseToken.balanceOf(MARKETPLACE_ADDRESS);
        console.log('\nMarketplace REUSE Balance:', marketplaceReuseBalance.toString());

        const requiredTokens = BigInt(QUANTITY) * (BigInt(10) ** BigInt(18));
        if (marketplaceReuseBalance < requiredTokens) {
            throw new Error(`Insufficient REUSE tokens in marketplace. Has: ${marketplaceReuseBalance.toString()}, Needs: ${requiredTokens.toString()}`);
        }

        // Check buyer's ETH balance
        const buyerBalance = await provider.getBalance(wallet.address);
        console.log('\nBuyer ETH Balance:', ethers.formatEther(buyerBalance), 'ETH');

        // Calculate total cost including gas
        const gasPrice = ethers.parseUnits('50', 'gwei');
        const gasLimit = 300000;
        const maxGasCost = BigInt(gasLimit) * gasPrice;
        const totalCost = BigInt(PRICE_IN_WEI) + maxGasCost;

        console.log('\nTransaction Cost Details:');
        console.log('-------------------------');
        console.log('Product Price:', ethers.formatEther(PRICE_IN_WEI), 'ETH');
        console.log('Max Gas Cost:', ethers.formatEther(maxGasCost), 'ETH');
        console.log('Total Cost:', ethers.formatEther(totalCost), 'ETH');

        if (buyerBalance < totalCost) {
            throw new Error(`Insufficient ETH. Need ${ethers.formatEther(totalCost)} ETH, have ${ethers.formatEther(buyerBalance)} ETH`);
        }

        console.log('\nExecuting purchase...');
        console.log('-------------------------');
        console.log('Buyer Address:', wallet.address);
        console.log('Product ID:', PRODUCT_ID);
        console.log('Quantity:', QUANTITY);
        console.log('Price in Wei:', PRICE_IN_WEI);

        // Execute the purchase with proper method encoding
        const tx = await contract.buyProduct(
            PRODUCT_ID,
            QUANTITY,
            {
                value: PRICE_IN_WEI,
                gasLimit: gasLimit,
                gasPrice: gasPrice
            }
        );

        console.log('\nTransaction sent:', tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        console.log('\nTransaction confirmed!');
        console.log('-------------------------');
        console.log('Transaction hash:', receipt.hash);
        console.log('Block number:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());
        
        // Parse the events
        const events = receipt.logs.map(log => {
            try {
                return contract.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        // Print event details
        events.forEach(event => {
            if (event.name === 'ProductPurchased') {
                console.log('\nPurchase Event Details:');
                console.log('-------------------------');
                console.log('Product ID:', event.args.productId.toString());
                console.log('Transaction ID:', event.args.transactionId.toString());
                console.log('Buyer:', event.args.buyer);
                console.log('Seller:', event.args.seller);
                console.log('Quantity:', event.args.quantity.toString());
                console.log('Total Price:', ethers.formatEther(event.args.totalPrice), 'ETH');
                console.log('Timestamp:', new Date(Number(event.args.timestamp) * 1000).toLocaleString());
            }
        });

    } catch (error) {
        console.error('\nError executing purchase:', error.message);
        if (error.reason) console.error('Reason:', error.reason);
        if (error.data) console.error('Error data:', error.data);
        if (error.transaction) {
            console.error('\nTransaction details:', {
                from: error.transaction.from,
                to: error.transaction.to,
                data: error.transaction.data,
                value: error.transaction.value
            });
        }
    }
}

executePurchase().catch(console.error); 
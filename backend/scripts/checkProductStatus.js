import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const MARKETPLACE_ADDRESS = '0xCC57Ffe7b7996453c90a34C77Ef4E742d7cDbbE3';
const PRODUCT_ID = '1';
const TOKEN_ID = '732';

// Marketplace ABI for product details
const MARKETPLACE_ABI = [
    "function products(uint256) view returns (uint256 id, address seller, string name, string description, uint256 price, uint256 quantity, bool isActive)",
    "function getTransaction(uint256) view returns (uint256 productId, address buyer, address seller, uint256 quantity, uint256 totalPrice, uint256 timestamp, uint8 status)",
    "function reuseToken() view returns (address)"
];

async function checkProductStatus() {
    try {
        // Connect to the network
        const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
        
        // Create contract instance
        const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

        // Get product details from blockchain
        const product = await marketplace.products(PRODUCT_ID);
        
        console.log('\nProduct Status On Blockchain:');
        console.log('-------------------------');
        console.log('Product ID:', product.id.toString());
        console.log('Seller:', product.seller);
        console.log('Name:', product.name);
        console.log('Price:', ethers.formatEther(product.price), 'ETH');
        console.log('Quantity Remaining:', product.quantity.toString());
        console.log('Is Active:', product.isActive);

        // Get REUSE token info
        const reuseTokenAddress = await marketplace.reuseToken();
        console.log('\nREUSE Token Address:', reuseTokenAddress);

        // Create REUSE token contract instance
        const reuseTokenABI = ["function balanceOf(address) view returns (uint256)"];
        const reuseToken = new ethers.Contract(reuseTokenAddress, reuseTokenABI, provider);
        const marketplaceReuseBalance = await reuseToken.balanceOf(MARKETPLACE_ADDRESS);
        console.log('Marketplace REUSE Token Balance:', marketplaceReuseBalance.toString());

        // If quantity is 0 or isActive is false, the product is sold
        const isSold = product.quantity.toString() === '0' || !product.isActive;
        console.log('\nProduct Status:', isSold ? 'SOLD' : 'AVAILABLE');

        // Try to get the latest transaction
        try {
            const transaction = await marketplace.getTransaction(1); // Latest transaction ID
            console.log('\nLatest Transaction:');
            console.log('-------------------------');
            console.log('Buyer:', transaction.buyer);
            console.log('Total Price:', ethers.formatEther(transaction.totalPrice), 'ETH');
            console.log('Timestamp:', new Date(Number(transaction.timestamp) * 1000).toLocaleString());
            console.log('Status:', ['Pending', 'Completed', 'Cancelled'][transaction.status]);
        } catch (e) {
            console.log('\nNo transaction found');
        }
        
    } catch (error) {
        console.error('Error checking product status:', error);
        if (error.reason) console.error('Reason:', error.reason);
    }
}

checkProductStatus().catch(console.error); 
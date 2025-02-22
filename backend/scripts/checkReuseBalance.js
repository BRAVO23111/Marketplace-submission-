import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const REUSE_TOKEN_ADDRESS = '0xbd2c564F33914831D00F0ab6FfDEC626697Db36B';
const MARKETPLACE_ADDRESS = '0xCC57Ffe7b7996453c90a34C77Ef4E742d7cDbbE3';
const BUYER_ADDRESS = '0x3baB04F8f23aa1348DE0a6ef37fC196dF938aCb8';

// Basic ERC20 ABI for balanceOf
const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

async function checkBalances() {
    try {
        // Connect to the network
        const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
        
        // Create REUSE token contract instance
        const reuseToken = new ethers.Contract(REUSE_TOKEN_ADDRESS, ERC20_ABI, provider);

        // Get token details
        const symbol = await reuseToken.symbol();
        
        // Check balances
        const marketplaceBalance = await reuseToken.balanceOf(MARKETPLACE_ADDRESS);
        const buyerBalance = await reuseToken.balanceOf(BUYER_ADDRESS);
        
        console.log('\nREUSE Token Balances:');
        console.log('-------------------');
        console.log('Marketplace Contract:', ethers.formatEther(marketplaceBalance), symbol);
        console.log('Buyer Address:', ethers.formatEther(buyerBalance), symbol);
        
    } catch (error) {
        console.error('Error checking balances:', error);
        if (error.reason) console.error('Reason:', error.reason);
    }
}

checkBalances().catch(console.error); 
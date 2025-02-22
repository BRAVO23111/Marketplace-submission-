import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const REUSE_TOKEN_ADDRESS = '0xbd2c564F33914831D00F0ab6FfDEC626697Db36B';
const MARKETPLACE_ADDRESS = '0xCC57Ffe7b7996453c90a34C77Ef4E742d7cDbbE3';
const AMOUNT_TO_TRANSFER = ethers.parseEther('10'); // Transfer 10 REUSE tokens

// Basic ERC20 ABI for transfer and balanceOf
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function transferTokens() {
    try {
        // Connect to the network
        const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
        
        // Create wallet instance using the private key from .env
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // Create REUSE token contract instance
        const reuseToken = new ethers.Contract(REUSE_TOKEN_ADDRESS, ERC20_ABI, wallet);

        // Check initial balances
        const initialBalance = await reuseToken.balanceOf(MARKETPLACE_ADDRESS);
        console.log('Initial marketplace REUSE balance:', ethers.formatEther(initialBalance));
        
        console.log('Transferring tokens...');
        console.log('From:', wallet.address);
        console.log('To:', MARKETPLACE_ADDRESS);
        console.log('Amount:', ethers.formatEther(AMOUNT_TO_TRANSFER), 'REUSE');

        // Execute the transfer
        const tx = await reuseToken.transfer(MARKETPLACE_ADDRESS, AMOUNT_TO_TRANSFER);
        console.log('Transaction sent:', tx.hash);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        
        // Check new balance
        const newBalance = await reuseToken.balanceOf(MARKETPLACE_ADDRESS);
        console.log('New marketplace REUSE balance:', ethers.formatEther(newBalance));
        
    } catch (error) {
        console.error('Error transferring tokens:', error);
        if (error.reason) console.error('Reason:', error.reason);
    }
}

transferTokens().catch(console.error); 
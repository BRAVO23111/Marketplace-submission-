require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    polygon_amoy: {
      url: "https://rpc-amoy.polygon.technology", // Amoy RPC
      chainId: 80002, // Amoy Testnet Chain ID
      accounts: [process.env.PRIVATE_KEY], // Load private key securely
    },
  },
};

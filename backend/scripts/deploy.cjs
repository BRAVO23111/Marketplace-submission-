const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to", hre.network.name);

  // Deploy ReuseToken first
  const ReuseToken = await hre.ethers.getContractFactory("ReuseToken");
  const reuseToken = await ReuseToken.deploy();
  await reuseToken.waitForDeployment();
  const tokenAddress = await reuseToken.getAddress();
  console.log("ReuseToken deployed to:", tokenAddress);

  // Deploy Marketplace with the token address
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(tokenAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  console.log("\nDeployment complete! Contract addresses:");
  console.log("----------------------------------------");
  console.log("ReuseToken:", tokenAddress);
  console.log("Marketplace:", marketplaceAddress);

  // Verify contracts on Polygon Amoy Explorer
  if (hre.network.name === "polygon_amoy") {
    console.log("\nVerifying contracts on Polygon Amoy Explorer...");
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        contract: "contracts/ReuseToken.sol:ReuseToken",
      });
      console.log("ReuseToken verified successfully");

      await hre.run("verify:verify", {
        address: marketplaceAddress,
        contract: "contracts/Marketplace.sol:Marketplace",
        constructorArguments: [tokenAddress],
      });
      console.log("Marketplace verified successfully");
    } catch (error) {
      console.error("Error verifying contracts:", error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

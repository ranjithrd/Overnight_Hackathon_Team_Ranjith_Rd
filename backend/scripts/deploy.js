const hre = require("hardhat");

async function main() {
  console.log("Deploying TransactionLedger contract to Sepolia...");
  console.log("");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  console.log("");
  
  const TransactionLedger = await hre.ethers.getContractFactory("TransactionLedger");
  const transactionLedger = await TransactionLedger.deploy();
  
  await transactionLedger.deployed();
  
  console.log("✓ TransactionLedger deployed to:", transactionLedger.address);
  console.log("");
  console.log("📋 Add this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${transactionLedger.address}`);
  console.log("");
  console.log("🎉 Deployment complete!");
  console.log("");
  console.log("⚠️  IMPORTANT: Update your existing .env with the new contract address");
  console.log("   This is a NEW contract with full data storage capabilities");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

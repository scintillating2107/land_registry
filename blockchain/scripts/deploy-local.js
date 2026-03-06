const hre = require("hardhat");

async function main() {
  const [deployer, registrar, bank, court] = await hre.ethers.getSigners();

  console.log("Deploying BhoomiChainRegistry with deployer:", deployer.address);

  const Registry = await hre.ethers.getContractFactory("BhoomiChainRegistry");
  const registry = await Registry.deploy(registrar.address, bank.address, court.address);
  await registry.waitForDeployment();

  console.log("BhoomiChainRegistry deployed to:", await registry.getAddress());
  console.log("Registrar addr:", registrar.address);
  console.log("Bank addr:", bank.address);
  console.log("Court addr:", court.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


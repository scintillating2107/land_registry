const { ethers } = require('ethers');

// Optional EVM adapter that mirrors actions to a real Solidity contract.
// Controlled via USE_EVM_BLOCKCHAIN env flag and EVM_RPC_URL, REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI_JSON.

let registry;

function getRegistry() {
  if (registry) return registry;
  if (process.env.USE_EVM_BLOCKCHAIN !== 'true') return null;

  const rpcUrl = process.env.EVM_RPC_URL;
  const addr = process.env.REGISTRY_CONTRACT_ADDRESS;
  const abiJson = process.env.REGISTRY_ABI_JSON;
  if (!rpcUrl || !addr || !abiJson) {
    console.warn('EVM config missing, skipping on-chain integration');
    return null;
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const pk = process.env.EVM_OPERATOR_PRIVATE_KEY;
  if (!pk) {
    console.warn('EVM_OPERATOR_PRIVATE_KEY missing, using provider signer[0] not supported here');
    return null;
  }
  const wallet = new ethers.Wallet(pk, provider);
  const abi = JSON.parse(abiJson);
  registry = new ethers.Contract(addr, abi, wallet);
  return registry;
}

async function onChainRegister({ propertyId, ownerAddress, ipfsHash }) {
  const c = getRegistry();
  if (!c) return null;
  const tx = await c.registerProperty(propertyId, ownerAddress, ipfsHash);
  return tx.wait();
}

async function onChainTransfer({ propertyId, fromAddress, toAddress }) {
  const c = getRegistry();
  if (!c) return null;
  const tx = await c.transferProperty(propertyId, fromAddress, toAddress);
  return tx.wait();
}

async function onChainMortgageLock({ propertyId }) {
  const c = getRegistry();
  if (!c) return null;
  const tx = await c.lockMortgage(propertyId);
  return tx.wait();
}

async function onChainMortgageRelease({ propertyId }) {
  const c = getRegistry();
  if (!c) return null;
  const tx = await c.releaseMortgage(propertyId);
  return tx.wait();
}

async function onChainLitigationFreeze({ propertyId, caseReference }) {
  const c = getRegistry();
  if (!c) return null;
  const tx = await c.freezeLitigation(propertyId, caseReference);
  return tx.wait();
}

async function onChainLitigationUnfreeze({ propertyId }) {
  const c = getRegistry();
  if (!c) return null;
  const tx = await c.unfreezeLitigation(propertyId);
  return tx.wait();
}

module.exports = {
  onChainRegister,
  onChainTransfer,
  onChainMortgageLock,
  onChainMortgageRelease,
  onChainLitigationFreeze,
  onChainLitigationUnfreeze,
};


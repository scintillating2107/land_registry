// IPFS utilities for MVP.
// We only validate CID-like hashes; uploading is out-of-scope for the local demo.

const CIDv1orV0Regex = /^[a-zA-Z0-9]+$/;

function validateIpfsHash(ipfsHash) {
  if (!ipfsHash) return { ok: true };
  const ok = CIDv1orV0Regex.test(ipfsHash) && ipfsHash.length >= 32 && ipfsHash.length <= 90;
  return ok
    ? { ok: true }
    : { ok: false, message: 'Invalid IPFS hash format. Expected CID-like alphanumeric string.' };
}

module.exports = {
  validateIpfsHash,
};


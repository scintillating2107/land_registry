// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BhoomiChainRegistry - Minimal on-chain registry for demo
/// @notice Mirrors core flows: register, transfer, mortgage, litigation.
contract BhoomiChainRegistry {
    enum MortgageStatus {
        NONE,
        ACTIVE
    }

    enum LitigationStatus {
        NONE,
        ACTIVE
    }

    struct Property {
        address owner;
        string ipfsHash;
        MortgageStatus mortgageStatus;
        LitigationStatus litigationStatus;
        bool disputed;
        bool exists;
    }

    address public registrar;
    address public bank;
    address public court;

    mapping(bytes32 => Property) public properties; // key = keccak256(propertyId string)

    event PropertyRegistered(string indexed propertyId, address indexed owner, string ipfsHash);
    event PropertyTransferred(string indexed propertyId, address indexed from, address indexed to);
    event MortgageLocked(string indexed propertyId, address indexed bank);
    event MortgageReleased(string indexed propertyId, address indexed bank);
    event LitigationFrozen(string indexed propertyId, address indexed court, string caseReference);
    event LitigationUnfrozen(string indexed propertyId, address indexed court);

    modifier onlyRegistrar() {
        require(msg.sender == registrar, "Only registrar");
        _;
    }

    modifier onlyBank() {
        require(msg.sender == bank, "Only bank");
        _;
    }

    modifier onlyCourt() {
        require(msg.sender == court, "Only court");
        _;
    }

    constructor(address _registrar, address _bank, address _court) {
        registrar = _registrar;
        bank = _bank;
        court = _court;
    }

    function _key(string memory propertyId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(propertyId));
    }

    function getProperty(string memory propertyId)
        external
        view
        returns (
            address owner,
            string memory ipfsHash,
            MortgageStatus mortgageStatus,
            LitigationStatus litigationStatus,
            bool disputed,
            bool exists
        )
    {
        bytes32 k = _key(propertyId);
        Property storage p = properties[k];
        return (p.owner, p.ipfsHash, p.mortgageStatus, p.litigationStatus, p.disputed, p.exists);
    }

    function registerProperty(
        string calldata propertyId,
        address owner,
        string calldata ipfsHash
    ) external onlyRegistrar {
        bytes32 k = _key(propertyId);
        require(!properties[k].exists, "Already registered");
        properties[k] = Property({
            owner: owner,
            ipfsHash: ipfsHash,
            mortgageStatus: MortgageStatus.NONE,
            litigationStatus: LitigationStatus.NONE,
            disputed: false,
            exists: true
        });
        emit PropertyRegistered(propertyId, owner, ipfsHash);
    }

    function transferProperty(
        string calldata propertyId,
        address from,
        address to
    ) external onlyRegistrar {
        bytes32 k = _key(propertyId);
        Property storage p = properties[k];
        require(p.exists, "Not registered");
        require(p.owner == from, "Not current owner");
        require(p.mortgageStatus == MortgageStatus.NONE, "Mortgage active");
        require(p.litigationStatus == LitigationStatus.NONE, "Litigation active");
        require(!p.disputed, "Property disputed");

        p.owner = to;
        emit PropertyTransferred(propertyId, from, to);
    }

    function lockMortgage(string calldata propertyId) external onlyBank {
        bytes32 k = _key(propertyId);
        Property storage p = properties[k];
        require(p.exists, "Not registered");
        require(p.mortgageStatus == MortgageStatus.NONE, "Mortgage already active");
        p.mortgageStatus = MortgageStatus.ACTIVE;
        emit MortgageLocked(propertyId, msg.sender);
    }

    function releaseMortgage(string calldata propertyId) external onlyBank {
        bytes32 k = _key(propertyId);
        Property storage p = properties[k];
        require(p.exists, "Not registered");
        require(p.mortgageStatus == MortgageStatus.ACTIVE, "No active mortgage");
        p.mortgageStatus = MortgageStatus.NONE;
        emit MortgageReleased(propertyId, msg.sender);
    }

    function freezeLitigation(
        string calldata propertyId,
        string calldata caseReference
    ) external onlyCourt {
        bytes32 k = _key(propertyId);
        Property storage p = properties[k];
        require(p.exists, "Not registered");
        require(p.litigationStatus == LitigationStatus.NONE, "Already active");
        p.litigationStatus = LitigationStatus.ACTIVE;
        emit LitigationFrozen(propertyId, msg.sender, caseReference);
    }

    function unfreezeLitigation(string calldata propertyId) external onlyCourt {
        bytes32 k = _key(propertyId);
        Property storage p = properties[k];
        require(p.exists, "Not registered");
        require(p.litigationStatus == LitigationStatus.ACTIVE, "No active case");
        p.litigationStatus = LitigationStatus.NONE;
        emit LitigationUnfrozen(propertyId, msg.sender);
    }

    function markDisputed(string calldata propertyId, bool isDisputed) external onlyRegistrar {
        bytes32 k = _key(propertyId);
        Property storage p = properties[k];
        require(p.exists, "Not registered");
        p.disputed = isDisputed;
    }
}


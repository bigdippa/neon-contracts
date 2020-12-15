const fs = require('fs');
const { ADDRESS } = require('../config');
const NEONToken = artifacts.require('NEONToken');
const Presale = artifacts.require('Presale');
const NEONVault = artifacts.require('NEONVault');
const GovernorAlpha = artifacts.require('GovernorAlpha');
// only for test
const LPTestToken = artifacts.require('LPTestToken');

function expertContractJSON(contractName, instance) {
  const path = "./test/abis/" + contractName + ".json";
  const data = {
    contractName,
    "address": instance.address,
    "abi": instance.abi
  }

  fs.writeFile(path, JSON.stringify(data), (err) => {
    if (err) throw err;
    console.log('Contract data written to file');
  });  
};

module.exports = async function (deployer) {
  await deployer.deploy(Presale);
  await deployer.deploy(NEONToken, Presale.address, ADDRESS.AIRDROP_UNISWAP, ADDRESS.AIRDROP_MARKET, ADDRESS.AIRDROP_TEAM);
  await deployer.deploy(NEONVault);
  await deployer.deploy(GovernorAlpha, ADDRESS.COMP_TIMELOCK, NEONToken.address, ADDRESS.CONTRACT_DEPLOYER);

  // only for test
  await deployer.deploy(LPTestToken, ADDRESS.AIRDROP_MARKET);

  expertContractJSON('Presale', Presale);
  expertContractJSON('NEONToken', NEONToken);
  expertContractJSON('NEONVault', NEONVault);
  expertContractJSON('GovernorAlpha', GovernorAlpha);
};

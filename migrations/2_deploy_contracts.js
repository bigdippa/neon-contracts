const fs = require('fs');
const { ADDRESS } = require('../config');
const NEONToken = artifacts.require('NEONToken');
const Presale = artifacts.require('Presale');
const NEONVaults = artifacts.require('NEONVaults');

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
  await deployer.deploy(NEONVaults);

  expertContractJSON('Presale', Presale);
  expertContractJSON('NEONToken', NEONToken);
  expertContractJSON('NEONVaults', NEONVaults);
};

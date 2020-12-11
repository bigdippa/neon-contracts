const BigNumber = require('bignumber.js');
const { ADDRESS } = require('../config');
const NEONToken = require('./abis/NEONToken.json');
const NEONVaults = require('./abis/NEONVaults.json');
const Presale = require('./abis/Presale.json');

it("Should be withrew from presale wallet", async () => {
    await NEON.methods.emergencyWithdrawFromPresaleWallet().send({ from: accounts[0] });
    const withdrewBalance = await NEON.methods.balanceOf(accounts[2]).call();
    assert.equal(withdrewBalance.valueOf(), 5000E18);

    const presaleBalance = await NEON.methods.balanceOf(Presale.address).call();
    assert.equal(presaleBalance.valueOf(), 0);
  });

  it("Should be withrew from Vaults wallet", async () => {
    await NEON.methods.emergencyWithdrawFromVaultsWallet().send({ from: accounts[0] });
    const withdrewBalance = await NEON.methods.balanceOf(accounts[3]).call();
    assert.equal(withdrewBalance.valueOf(), 4250E18);

    const vaultsBalance = await NEON.methods.balanceOf(NEONVaults.address).call();
    assert.equal(vaultsBalance.valueOf(), 0);
  });

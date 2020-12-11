const BigNumber = require('bignumber.js');
const { ADDRESS } = require('../config');
const NEONToken = require('./abis/NEONToken.json');
const NEONVaults = require('./abis/NEONVaults.json');
const Presale = require('./abis/Presale.json');

contract("NEONToken test", async accounts => {
  const NEON = await new web3.eth.Contract(NEONToken.abi, NEONToken.address);
  const NEONVault = await new web3.eth.Contract(NEONVaults.abi, NEONVaults.address);

  it("Should put 0 NEONToken in the first account", async () => {
    const balance = await NEON.methods.balanceOf(accounts[0]).call();
    assert.equal(balance.valueOf(), 0);
  });

  it("Should be 5000E18 NEONToken in presale " + Presale.address, async () => {
    const balance = await NEON.methods.balanceOf(Presale.address).call();
    assert.equal(balance.valueOf(), 5000E18);
  });

  it("Should be 4250E18 NEONToken in Uniswap " + ADDRESS.AIRDROP_UNISWAP, async () => {
    const balance = await NEON.methods.balanceOf(ADDRESS.AIRDROP_UNISWAP).call();
    assert.equal(balance.valueOf(), 4250E18);
  });

  it("Should be 500E18 NEONToken in market " + ADDRESS.AIRDROP_MARKET, async () => {
    const balance = await NEON.methods.balanceOf(ADDRESS.AIRDROP_MARKET).call();
    assert.equal(balance.valueOf(), 500E18);
  });

  it("Should be 250E18 NEONToken in team " + ADDRESS.AIRDROP_TEAM, async () => {
    const balance = await NEON.methods.balanceOf(ADDRESS.AIRDROP_TEAM).call();
    assert.equal(balance.valueOf(), 250E18);
  });

  it("Should be token's name is 'NEONToken'", async () => {
    const name = await NEON.methods.name().call();
    assert.equal(name, "NEONToken");
  });

  it("Should be token's symbol is 'NEON'", async () => {
    const symbol = await NEON.methods.symbol().call();
    assert.equal(symbol, "NEON");
  });

  it("Should be decimal is 18", async () => {
    const decimal = await NEON.methods.decimals().call();
    assert.equal(decimal.valueOf(), 18);
  });

  it("Should be total supply is 10000E18", async () => {
    const totalSupply = await NEON.methods.totalSupply().call();
    assert.equal(totalSupply.valueOf(), 10000E18);
  });

  it("Should be trasfer fee is 100 in initial", async () => {
    const transferFee = await NEON.methods.transferFee().call();
    assert.equal(transferFee, 100);
  });

  it("Should be changed transfer fee to 225" , async () => {
    await NEON.methods.changeTransferFee('225').send({ from: accounts[0] });
    const transferFee = await NEON.methods.transferFee().call();
    assert.equal(transferFee, 225);
  });

  it("Should be changed transfer fee to 100" , async () => {
    await NEON.methods.changeTransferFee('100').send({ from: accounts[0] });
    const transferFee = await NEON.methods.transferFee().call();
    assert.equal(transferFee, 100);
  });

  it("Should be Governance address is " + accounts[0], async () => {
    const governance = await NEON.methods.governance().call();
    assert.equal(governance, accounts[0]);
  });
  
  it("Should be changed Governance address to " + accounts[1], async () => {
    await NEON.methods.transferOwnership(accounts[1]).send({ from: accounts[0] });
    const governance = await NEON.methods.governance().call();
    assert.equal(governance, accounts[1]);
  });

  it("Should be changed Governance address to " + accounts[0], async () => {
    await NEON.methods.transferOwnership(accounts[0]).send({ from: accounts[1] });
    const governance = await NEON.methods.governance().call();
    assert.equal(governance, accounts[0]);
  });

  it("Should be unpaused in initial", async () => {
    const paused = await NEON.methods.paused().call();
    assert.equal(paused, false);
  });

  it("Should be paused", async () => {
    await NEON.methods.pause().send({ from: accounts[0] });
    const paused = await NEON.methods.paused().call();
    assert.equal(paused, true);
  });

  it("Should be unpaused", async () => {
    await NEON.methods.unpause().send({ from: accounts[0] });
    const paused = await NEON.methods.paused().call();
    assert.equal(paused, false);
  });

  it("Should be NEONVaults address is zero in initial", async () => {
    const address = await NEON.methods.neonVaults().call();
    assert.equal(address, 0);
  });

  it("Should be changed NEONVaults address to " + NEONVaults.address, async () => {
    await NEON.methods.changeNeonVaults(NEONVaults.address).send({ from: accounts[0] });
    const address = await NEON.methods.neonVaults().call();
    assert.equal(address, NEONVaults.address);
  });

  it("Should be presale address is " + Presale.address, async () => {
    const address = await NEON.methods.neonPresale().call();
    assert.equal(address, Presale.address);
  });

  it("Should be changed presale address to " + accounts[1], async () => {
    await NEON.methods.changeNeonPresale(accounts[1]).send({ from: accounts[0] });
    const address = await NEON.methods.neonPresale().call();
    assert.equal(address, accounts[1]);

    await NEON.methods.changeNeonPresale(Presale.address).send({ from: accounts[0] });
    const changedAddress = await NEON.methods.neonPresale().call();
    assert.equal(changedAddress, Presale.address);

  });

  it("Should be sent token correctly", async () => {
    // change neon address in NEONVaults
    await NEONVault.methods.changeNeonAddress(NEONToken.address).send({ from: accounts[0] });
    const NEONAddress = await NEONVault.methods.neonAddress().call();
    assert.equal(NEONAddress, NEONToken.address);

    const transferFee = new BigNumber(await NEON.methods.transferFee().call());
    const sendAmount = new BigNumber(100E18);
    const feeAmount = sendAmount.times(transferFee).div(10000);

    // send 100 token from market to accounts[0]
    const expectedBalance = sendAmount.minus(feeAmount);
    let marketBalance = new BigNumber(await NEON.methods.balanceOf(ADDRESS.AIRDROP_MARKET).call());
    const restBalance = marketBalance.minus(sendAmount);

    // await NEON.methods.approve(accounts[0], sendAmount.toString(10)).send({ from: Presale.address });
    // await NEON.methods.transferFrom(Presale.address, accounts[0], sendAmount.toString(10)).send({ from: Presale.address });
    await NEON.methods.transfer(accounts[0], sendAmount.toString(10)).send({ from: ADDRESS.AIRDROP_MARKET });
    const receivedBalance = new BigNumber(await NEON.methods.balanceOf(accounts[0]).call());
    const vaultsBalance = new BigNumber(await NEON.methods.balanceOf(NEONVaults.address).call());
    marketBalance = new BigNumber(await NEON.methods.balanceOf(ADDRESS.AIRDROP_MARKET).call());
    
    assert.equal(receivedBalance.toString(10), expectedBalance.toString(10));
    assert.equal(restBalance.toString(10), marketBalance.toString(10));
    assert.equal(feeAmount.toString(10), vaultsBalance.toString(10));
  });
});
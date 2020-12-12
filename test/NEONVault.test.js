const BigNumber = require('bignumber.js');
const { ADDRESS } = require('../config');
const NEONToken = require('./abis/NEONToken.json');
const NEONVault = require('./abis/NEONVault.json');
const Presale = require('./abis/Presale.json');

contract("NEONToken test", async accounts => {
  const INEON = await new web3.eth.Contract(NEONToken.abi, NEONToken.address);
  const INEONVault = await new web3.eth.Contract(NEONVault.abi, NEONVault.address);

  it("Should be reward period is 1 days in initial", async () => {
    const rewardPeriod = await INEONVault.methods.rewardPeriod().call();
    assert.equal(rewardPeriod.valueOf(), 86400);
  });

  it("Should be changed reward period is 2 days", async () => {
    await INEONVault.methods.changeRewardPeriod(2*86400).send({ from: accounts[0] });
    let rewardPeriod = await INEONVault.methods.rewardPeriod().call();
    assert.equal(rewardPeriod.valueOf(), 86400*2);
    await INEONVault.methods.changeRewardPeriod(86400).send({ from: accounts[0] });
    rewardPeriod = await INEONVault.methods.rewardPeriod().call();
    assert.equal(rewardPeriod.valueOf(), 86400);
  });

  it("Should be Uniswap V2 address is zero in initial", async () => {
    const address = await INEONVault.methods.uniswapV2Pair().call();
    assert.equal(address, 0);
  });

  it("Should be changed Uniswap V2 address to " + accounts[1], async () => {
    await INEONVault.methods.changeUniswapV2Pair(accounts[1]).send({ from: accounts[0] });
    const address = await INEONVault.methods.uniswapV2Pair().call();
    assert.equal(address, accounts[1]);
  });

  it("Should be NEON address is zero in initial", async () => {
    const address = await INEONVault.methods.neonAddress().call();
    assert.equal(address, 0);
  });

  it("Should be changed Uniswap V2 address to " + accounts[1], async () => {
    await INEONVault.methods.changeNeonAddress(accounts[1]).send({ from: accounts[0] });
    const address = await INEONVault.methods.neonAddress().call();
    assert.equal(address, accounts[1]);
  });

  it("Should be dev fee receiver address is zero in initial", async () => {
    const address = await INEONVault.methods.devFeeReciever().call();
    assert.equal(address, 0);
  });

  it("Should be changed dev fee receiver address to " + accounts[1], async () => {
    await INEONVault.methods.changeDevFeeReciever(accounts[1]).send({ from: accounts[0] });
    const address = await INEONVault.methods.neonAddress().call();
    assert.equal(address, accounts[1]);
  });

  it("Should be dev fee is 400 in initial", async () => {
    const devFee = await INEONVault.methods.devFee().call();
    assert.equal(devFee.valueOf(), 400);
  });

  it("Should be changed dev fee to 500", async () => {
    await INEONVault.methods.changeDevFee(500).send({ from: accounts[0] });
    let devFee = await INEONVault.methods.devFee().call();
    assert.equal(devFee.valueOf(), 500);
    await INEONVault.methods.changeDevFee(400).send({ from: accounts[0] });
    devFee = await INEONVault.methods.devFee().call();
    assert.equal(devFee.valueOf(), 400);
  });


  //   it("Should be sent token correctly", async () => {
  //     // change neon address in NEONVault
  //     await INEONVault.methods.changeNeonAddress(NEONToken.address).send({ from: accounts[0] });
  //     const NEONAddress = await INEONVault.methods.neonAddress().call();
  //     assert.equal(NEONAddress, NEONToken.address);

  //     const transferFee = new BigNumber(await INEON.methods.transferFee().call());
  //     const sendAmount = new BigNumber(100E18);
  //     const feeAmount = sendAmount.times(transferFee).div(10000);

  //     // send 100 token from market to accounts[0]
  //     const expectedBalance = sendAmount.minus(feeAmount);
  //     let marketBalance = new BigNumber(await INEON.methods.balanceOf(ADDRESS.AIRDROP_MARKET).call());
  //     const restBalance = marketBalance.minus(sendAmount);

  //     // await INEON.methods.approve(accounts[0], sendAmount.toString(10)).send({ from: Presale.address });
  //     // await INEON.methods.transferFrom(Presale.address, accounts[0], sendAmount.toString(10)).send({ from: Presale.address });
  //     await INEON.methods.transfer(accounts[0], sendAmount.toString(10)).send({ from: ADDRESS.AIRDROP_MARKET });
  //     const receivedBalance = new BigNumber(await INEON.methods.balanceOf(accounts[0]).call());
  //     const vaultBalance = new BigNumber(await INEON.methods.balanceOf(NEONVault.address).call());
  //     marketBalance = new BigNumber(await INEON.methods.balanceOf(ADDRESS.AIRDROP_MARKET).call());

  //     assert.equal(receivedBalance.toString(10), expectedBalance.toString(10));
  //     assert.equal(restBalance.toString(10), marketBalance.toString(10));
  //     assert.equal(feeAmount.toString(10), vaultBalance.toString(10));
  //   });
});
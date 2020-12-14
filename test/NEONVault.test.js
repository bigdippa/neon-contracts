const BigNumber = require('bignumber.js');
const { ADDRESS } = require('../config');
const NEONToken = artifacts.require('NEONToken');
const Presale = artifacts.require('Presale');
const NEONVault = artifacts.require('NEONVault');
const LPTestToken = artifacts.require('LPTestToken');

function toBN(value) {
  return new BigNumber(value);
}

function toBNString(value) {
  const bn = new BigNumber(value);
  return bn.toString(10);
}

contract("NEONVault test", async accounts => {
  it("Should be reward period is 1 days in initial", async () => {
    const INEONVault = await NEONVault.deployed();
    const rewardPeriod = await INEONVault.rewardPeriod.call();
    assert.equal(rewardPeriod.valueOf(), 86400);
  });

  it("Should be changed reward period is 2 days", async () => {
    const INEONVault = await NEONVault.deployed();
    await INEONVault.changeRewardPeriod(2*86400, { from: accounts[0] });
    let rewardPeriod = await INEONVault.rewardPeriod.call();
    assert.equal(rewardPeriod.valueOf(), 86400*2);

    await INEONVault.changeRewardPeriod(86400, { from: accounts[0] });
    rewardPeriod = await INEONVault.rewardPeriod.call();
    assert.equal(rewardPeriod.valueOf(), 86400);
  });

  it("Should be Uniswap V2 address is zero in initial", async () => {
    const INEONVault = await NEONVault.deployed();
    const address = await INEONVault.uniswapV2Pair.call();
    assert.equal(address, 0);
  });

  it("Should be changed Uniswap V2 address to " + accounts[1], async () => {
    const INEONVault = await NEONVault.deployed();
    await INEONVault.changeUniswapV2Pair(accounts[1], { from: accounts[0] });
    const address = await INEONVault.uniswapV2Pair.call();
    assert.equal(address, accounts[1]);
  });

  it("Should be NEON address is zero in initial", async () => {
    const INEONVault = await NEONVault.deployed();
    const address = await INEONVault.neonAddress.call();
    assert.equal(address, 0);
  });

  it("Should be changed Uniswap V2 address to " + accounts[1], async () => {
    const INEONVault = await NEONVault.deployed();
    await INEONVault.changeNeonAddress(accounts[1], { from: accounts[0] });
    const address = await INEONVault.neonAddress.call();
    assert.equal(address, accounts[1]);
  });

  it("Should be dev fee receiver address is zero in initial", async () => {
    const INEONVault = await NEONVault.deployed();
    const address = await INEONVault.devFeeReciever.call();
    assert.equal(address, 0);
  });

  it("Should be changed dev fee receiver address to " + accounts[1], async () => {
    const INEONVault = await NEONVault.deployed();
    await INEONVault.changeDevFeeReciever(accounts[1], { from: accounts[0] });
    const address = await INEONVault.neonAddress.call();
    assert.equal(address, accounts[1]);
  });

  it("Should be dev fee is 400 in initial", async () => {
    const INEONVault = await NEONVault.deployed();
    const devFee = await INEONVault.devFee.call();
    assert.equal(devFee.valueOf(), 400);
  });

  it("Should be changed dev fee to 500", async () => {
    const INEONVault = await NEONVault.deployed();
    await INEONVault.changeDevFee(500, { from: accounts[0] });
    let devFee = await INEONVault.devFee.call();
    assert.equal(devFee.valueOf(), 500);

    await INEONVault.changeDevFee(400, { from: accounts[0] });
    devFee = await INEONVault.devFee.call();
    assert.equal(devFee.valueOf(), 400);
  });

  // accounts[0] is deployer, governance
  it("Should be work perfectly for Vault", async () => {
    const IPresale = await Presale.deployed();
    const INEON = await NEONToken.deployed();
    const INEONVault = await NEONVault.deployed();
    const ILPTestToken = await LPTestToken.deployed();
    
    // check if airdrop done to correct addresses
    let presaleBalance = toBNString(await INEON.balanceOf.call(IPresale.address));
    assert.equal(presaleBalance, toBNString(5000E18));

    let uniswapBalance = toBNString(await INEON.balanceOf.call(ADDRESS.AIRDROP_UNISWAP));
    assert.equal(uniswapBalance, toBNString(4250E18));

    let marketBalance = toBN(await INEON.balanceOf.call(ADDRESS.AIRDROP_MARKET));
    assert.equal(marketBalance.toString(10), toBNString(500E18));

    let teamBalance = toBNString(await INEON.balanceOf.call(ADDRESS.AIRDROP_TEAM));
    assert.equal(teamBalance, toBNString(250E18));

    // change neon address in NEONVault
    await INEONVault.changeNeonAddress(INEON.address, { from: accounts[0] });
    const NEONAddress = await INEONVault.neonAddress.call();
    assert.equal(NEONAddress, INEON.address);

    // change rewardPeriod to 5 min for test
    await INEONVault.changeRewardPeriod(300, { from: accounts[0] });
    const rewardPeriod = await INEONVault.rewardPeriod.call();
    assert.equal(rewardPeriod.valueOf(), 300);

    // change NEONVault address of NEONToken contract.
    await INEON.changeNEONVault(INEONVault.address, { from: accounts[0] });
    const NEONVaultAddress = await INEON.NEONVault.call();
    assert.equal(NEONVaultAddress, INEONVault.address);

    const transferFee = toBN(await INEON.transferFee.call());
    let sendAmount = toBN(100E18);
    let feeAmount = sendAmount.times(transferFee).div(10000);

    // send 100 token from market address to accounts[0]
    let expectedReceivedAmount = sendAmount.minus(feeAmount);
    let restMarketBalance = marketBalance.minus(sendAmount);

    // transfer token
    await INEON.transfer(accounts[1], sendAmount.toString(10), { from: ADDRESS.AIRDROP_MARKET });
    let receivedBalance = toBNString(await INEON.balanceOf.call(accounts[1]));
    marketBalance = toBNString(await INEON.balanceOf.call(ADDRESS.AIRDROP_MARKET));
    assert.equal(receivedBalance, expectedReceivedAmount.toString(10));
    assert.equal(marketBalance, restMarketBalance.toString(10));

    let rewardBalance = toBNString(await INEON.balanceOf.call(NEONVault.address));
    assert.equal(rewardBalance, feeAmount.toString(10));

    // get contract startedTime
    const startedTime = toBNString(await INEONVault.contractStartTime.call());
    const lastRewardedTime = toBNString(await INEONVault.lastRewardedTime.call());
    assert.equal(startedTime, lastRewardedTime);

    // check epoch reward
    let epochReward = toBNString(await INEONVault.epochReward.call(startedTime));
    assert.equal(epochReward, feeAmount.toString(10));

    let totalStakedAmount = toBNString(await INEONVault.totalStakedAmount.call());
    assert.equal(totalStakedAmount, 0);

    let epochTotalStakedAmount = toBNString(await INEONVault.epochTotalStakedAmount.call(startedTime));
    assert.equal(epochTotalStakedAmount, 0);

    let userTotalStakedAmount = toBNString(await INEONVault.userTotalStakedAmount.call());
    assert.equal(userTotalStakedAmount, 0);

    let userEpochStakedAmount = toBNString(await INEONVault.userEpochStakedAmount.call(startedTime));
    assert.equal(userEpochStakedAmount, 0);

    // get devFee
    const devFee = toBNString(await INEONVault.devFee.call());

    // get rewards
    let reward = toBNString(await INEONVault.getReward.call({ from: ADDRESS.AIRDROP_MARKET }));
    assert.equal(reward, 0);

    // try to stake sample erc20 token

    // check test token
    const testTokenTotalSupply = toBNString(await ILPTestToken.totalSupply.call());
    assert.equal(testTokenTotalSupply, toBNString(1000E18));

    let LPTokneBalance = toBNString(await ILPTestToken.balanceOf.call(ADDRESS.AIRDROP_MARKET));
    assert.equal(LPTokneBalance.toString(10), toBNString(1000E18));

    // set uniswap v2 pair contract address
    await INEONVault.changeUniswapV2Pair(ILPTestToken.address, { from: accounts[0] });
    const uniswapV2PariAddress = await INEONVault.uniswapV2Pair.call();
    assert.equal(uniswapV2PariAddress, ILPTestToken.address);

    // stake token
    // staker is ADDRESS.AIRDROP_MARKET
    await ILPTestToken.approve(INEONVault.address, LPTokneBalance, { from: ADDRESS.AIRDROP_MARKET });
    await INEONVault.stake(LPTokneBalance, { from: ADDRESS.AIRDROP_MARKET });

    const userStartedTime = toBNString(await INEONVault.userStartedTime.call(ADDRESS.AIRDROP_MARKET));
    assert.equal(userStartedTime, lastRewardedTime);

    totalStakedAmount = toBNString(await INEONVault.totalStakedAmount.call({ from: ADDRESS.AIRDROP_MARKET }));
    assert.equal(totalStakedAmount, LPTokneBalance);

    epochTotalStakedAmount = toBNString(await INEONVault.epochTotalStakedAmount.call(startedTime, { from: ADDRESS.AIRDROP_MARKET }));
    assert.equal(epochTotalStakedAmount, LPTokneBalance);

    userTotalStakedAmount = toBNString(await INEONVault.userTotalStakedAmount.call({ from: ADDRESS.AIRDROP_MARKET }));
    assert.equal(userTotalStakedAmount, LPTokneBalance);

    userEpochStakedAmount = toBNString(await INEONVault.userEpochStakedAmount.call(startedTime, { from: ADDRESS.AIRDROP_MARKET }));
    assert.equal(userEpochStakedAmount, LPTokneBalance);

    // get rewards
    // rewards should be zero because of not passed reward period yet
    reward = toBNString(await INEONVault.getReward.call({ from: ADDRESS.AIRDROP_MARKET }));
    assert.equal(reward, 0);

 
  });
});
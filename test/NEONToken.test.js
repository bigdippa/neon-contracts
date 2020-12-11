const BigNumber = require('bignumber.js');
const { ADDRESS } = require('../config');
const NEONToken = require('./abis/NEONToken.json');
const Presale = require('./abis/Presale.json');

contract("NEONToken test", async accounts => {
  const NEON = await new web3.eth.Contract(NEONToken.abi, NEONToken.address);

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

  // it("Should send token correctly", async () => {
  //   const account_one = '0xc76F07D4FF0aa6B21351D61218C111eEd481287c';
  //   const account_two = accounts[0];
  //   const amount = new BigNumber(1000000E18);
  //   let balance = await NEON.methods.balanceOf(account_one).call();
  //   const account_one_starting_balance = new BigNumber(balance);
  //   balance = new BigNumber(3500000E18);
  //   assert.equal(account_one_starting_balance.toNumber(), balance.toNumber());

  //   balance = await NEON.methods.balanceOf(account_two).call();
  //   const account_two_starting_balance = new BigNumber(balance);
  //   balance = new BigNumber(0);
  //   assert.equal(account_two_starting_balance.toNumber(), balance.toNumber());

  //   //await NEON.approve(account_two, amount, {from: account_one});
  //   //await NEON.transfer(account_two, amount, { from: account_one });
  //   await NEON.methods.approve(account_two, amount).send({ from: account_one });
  //   await NEON.methods.transfer(account_two, amount).send({ from: account_one });

  //   balance = await NEON.methods.balanceOf(account_one).call();
  //   const account_one_ending_balance = new BigNumber(balance);
  //   balance = await NEON.methods.balanceOf(account_two).call();
  //   const account_two_ending_balance = new BigNumber(balance);

  //   assert.equal(
  //     account_one_ending_balance.toNumber(),
  //     account_one_starting_balance.minus(amount).toNumber(),
  //     "Amount wasn't correctly taken from the sender"
  //   );
  //   assert.equal(
  //     account_two_ending_balance.toNumber(),
  //     account_two_starting_balance.plus(amount).toNumber(),
  //     "Amount wasn't correctly sent to the receiver"
  //   );
  // });
});
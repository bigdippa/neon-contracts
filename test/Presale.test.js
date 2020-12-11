const BigNumber = require('bignumber.js');
const NEONToken = require('./abis/NEONToken.json');
const Presale = require('./abis/Presale.json');

contract("Presale test", async accounts => {
  const INEON = await new web3.eth.Contract(NEONToken.abi, NEONToken.address);
  const IPresale = await new web3.eth.Contract(Presale.abi, Presale.address);

  it("Should be NEON token address is zero in initial", async () => {
    const neonTokenAddress = await IPresale.methods.neonTokenAddress().call();
    assert.equal(neonTokenAddress, 0);
  });

  it("Should be changed NEON token address to " + NEONToken.address , async () => {
    await IPresale.methods.changeNeonTokenAddress(NEONToken.address).send({ from: accounts[0] });
    const neonTokenAddress = await IPresale.methods.neonTokenAddress().call();
    assert.equal(neonTokenAddress, NEONToken.address);
  });

  it("Should be presale rate is 5 in initial", async () => {
    const rate = await IPresale.methods.rate().call();
    assert.equal(rate.valueOf(), 5);
  });

  it("Should be changed rate to 10" , async () => {
    await IPresale.methods.changeRate(10).send({ from: accounts[0] });
    const rate = await IPresale.methods.rate().call();
    assert.equal(rate.valueOf(), 10);
  });

  it("Should be deposit min amount is 5E17(0.5 ETH) in initial", async () => {
    const amount = await IPresale.methods.depositeMinAmount().call();
    assert.equal(amount.valueOf(), 5E17);
  });

  it("Should be changed deposit min amount to 5E18(1 ETH)" , async () => {
    let newValue = new BigNumber(5E18);
    await IPresale.methods.changeDepositeMinAmount(newValue.toString(10)).send({ from: accounts[0] });
    let amount = await IPresale.methods.depositeMinAmount().call();
    assert.equal(amount.valueOf(), 5E18);
    
    newValue = new BigNumber(5E17);
    await IPresale.methods.changeDepositeMinAmount(newValue.toString(10)).send({ from: accounts[0] });
    amount = await IPresale.methods.depositeMinAmount().call();
    assert.equal(amount.valueOf(), 5E17);
  });

  it("Should be deposit max amount is 20E18(20 ETH) in initial", async () => {
    const amount = await IPresale.methods.depositeMaxAmount().call();
    assert.equal(amount.valueOf(), 20E18);
  });

  it("Should be changed deposit max amount to 100E18(100 ETH)" , async () => {
    const newValue = new BigNumber(100E18);
    await IPresale.methods.changeDepositeMaxAmount(newValue.toString(10)).send({ from: accounts[0] });
    const amount = await IPresale.methods.depositeMaxAmount().call();
    assert.equal(amount.valueOf(), 100E18);
  });

  it("Should be deposited correctly" , async () => {
    const depositAmout = new BigNumber(1E18);

    await web3.eth.sendTransaction({
      from: accounts[1],
      to: Presale.address,
      value: depositAmout.toString(10)
    });
    
    const totalDepositedAmount = await IPresale.methods.totalDepositedAmount().call();
    assert.equal(totalDepositedAmount.valueOf(), depositAmout.toString(10));

    const userDepositedAmount = new BigNumber(await IPresale.methods.depositedAmount(accounts[1]).call());
    assert.equal(userDepositedAmount.toString(10), depositAmout.toString(10));

    const tokenBalance = new BigNumber(await INEON.methods.balanceOf(accounts[1]).call());
    const rate = await IPresale.methods.rate().call();
    const expectedTokenBalance = userDepositedAmount.times(BigNumber(rate));

    assert.equal(tokenBalance.toString(10), expectedTokenBalance.toString(10));
  });

  it("Should be withrew ETH from presale wallet", async () => {
    let balance1 = await web3.eth.getBalance(Presale.address);
    let balance2 = await web3.eth.getBalance(accounts[0]);
    await IPresale.methods.withdraw().send({ from: accounts[0] });
    balance1 = await web3.eth.getBalance(Presale.address);
    balance2 = await web3.eth.getBalance(accounts[0]);

    assert.equal(balance1.valueOf(), 0);
  });

  it("Should be withrew tokens from presale wallet", async () => {
    const balance = await INEON.methods.balanceOf(Presale.address).call();

    await IPresale.methods.transferOwnership(accounts[9]).send({ from: accounts[0] });

    await IPresale.methods.emergencyWithdrawToken().send({ from: accounts[9] });
    const withdrewBalance = await INEON.methods.balanceOf(accounts[9]).call();
    assert.equal(withdrewBalance.valueOf(), balance.valueOf());

    const presaleBalance = await INEON.methods.balanceOf(Presale.address).call();
    assert.equal(presaleBalance.valueOf(), 0);

    await IPresale.methods.transferOwnership(accounts[0]).send({ from: accounts[9] });
  });
});

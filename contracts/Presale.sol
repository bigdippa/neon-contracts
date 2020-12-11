// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./Context.sol";
import "./Ownable.sol";
import "./SafeMath.sol";

interface INEON {
    function transferWithoutFee(address recipient, uint256 amount) external returns (bool);
}

contract Presale is Ownable {
    using SafeMath for uint256;
     
    uint256 private _depositMinAmount;
    uint256 private _depositMaxAmount;
    address private _tokenAddress;
    uint256 private _rate;

    mapping(address => uint256) _depositedAmounts;

    event Deposited(address account, uint256 amount);
    event SentToken(address account, uint256 fund, uint256 amount);
    
    constructor() {
        // Number of tokens per 1 ETH = 5 (initial value)
        _rate = 5;
        // Minimum deposit amount  = 0.5 ETH (initial value)
        _depositMinAmount = 5E17;
        // Maximum deposit amount  = 20 ETH (initial value)
        _depositMaxAmount = 20E18;
    }

    // get number of tokens per 1 ETH
    function getRate() external view returns (uint256) {
        return _rate;
    }

    // set number of tokens per 1 ETH
    function setRate(uint256 rate) external onlyGovernance {
        _rate = rate;
    }

    // get min amount to deposite
    function getDepositeMinAmount() external view returns (uint256) {
        return _depositMinAmount;
    }

    // set min amount to deposite
    function setDepositeMinAmount(uint256 minAmount) external onlyGovernance {
        _depositMinAmount = minAmount;
    }

    // get max amount to deposite
    function getDepositeMaxAmount() external view returns (uint256) {
        return _depositMaxAmount;
    }

    // set max amount to deposite
    function setDepositeMaxAmount(uint256 maxAmount) external onlyGovernance {
        _depositMaxAmount = maxAmount;
    }

    // get user's deposited amount
    function getDepositedAmount(address account) external view returns (uint256) {
        return _depositedAmounts[account];
    }

    // get the total ether balance deposited by users
    function getTotalDepositedAmount() public view returns (uint256){
        return address(this).balance;
    }

    function setTokenAddress(address tokenAddress) public onlyGovernance {
        _tokenAddress = tokenAddress;
    }

    function getTokenAddress() public view returns (address) {
        return _tokenAddress;
    }
    
    // fall back function to receive ether
    receive() external payable {
       _deposite();
    }
    
    function _deposite() private {
        require(!_isContract(_msgSender()), "Could not be a contract");
        require(governance() != _msgSender(), "You are onwer.");
        require(msg.value >= _depositMinAmount, "Should be great than minimum deposit amount.");
        require(msg.value <= _depositMaxAmount, "Should be less than maximum deposit amount.");

        uint256 fund = msg.value;
        _depositedAmounts[_msgSender()] = _depositedAmounts[_msgSender()].add(fund);
        emit Deposited(_msgSender(), fund);

        // send token to user
        uint256 tokenAmount = fund.mul(_rate);
        INEON(_tokenAddress).transferWithoutFee(_msgSender(), tokenAmount);

        emit SentToken(_msgSender(), fund, tokenAmount);
    }

    // Withdraw eth to owner when need it
    function withdraw() external payable onlyGovernance {
        require(getTotalDepositedAmount() > 0, "Ether balance is zero.");
        msg.sender.transfer(getTotalDepositedAmount());
    }

    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }
}

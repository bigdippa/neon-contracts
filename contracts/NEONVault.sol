// SPDX-License-Identifier: MIT

pragma solidity >=0.4.22 <0.8.0;

import "./SafeMath.sol";
import "./Context.sol";
import "./Ownable.sol";
import "./INEON.sol";
import "./IUIV2PAIR.sol";

contract NEONVault is Context, Ownable {
    using SafeMath for uint256;
    
    // States
    address private _uniswapV2Pair;
    address private _neonAddress;
    address private _devAddress;
    uint16 private _devFee;

    // Period of reward distribution to stakers
    // It is `1 days` by default and could be changed
    // later only by Governance
    uint256 private _rewardPeriod;
    // save the timestamp for every period's reward
    uint256 private _lastRewardedTime;
    uint256 private _contractStartTime;
    uint256 private _totalStakedAmount;

    mapping(uint256 => uint256) private _epochRewards;
    mapping(uint256 => uint256) private _epochTotalStakedAmounts;
    mapping(address => uint256) private _userTotalStakedAmounts;
    mapping(address => uint256) private _userStartedTimes;
    mapping(uint256 => mapping (address => uint256)) private _userEpochStakedAmounts;

    // Events
    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event ChangedRewardPeriod(address indexed governance, uint256 value);
    event ChangedUniswapV2Pair(address indexed governance, address indexed uniswapV2Pair);
    event ChangedNeonAddress(address indexed governance, address indexed neonAddress);
    event changedDevFeeReciever(address indexed governance, address indexed oldAddress, address indexed newAddress);
    event EmergencyWithdrewToken(address indexed from, address indexed to, uint256 amount);
    event WithdrewReward(address indexed staker, uint256 amount);
    
    // Modifier

    /**
     * @dev Throws if called by any account other than the NEON token contract.
     */
    modifier onlyNeon() {
        require(_neonAddress == _msgSender(), "Ownable: caller is not the NEON token contract");
        _;
    }

    constructor() {
        _rewardPeriod = 1 days;
        _contractStartTime = block.timestamp;
        _lastRewardedTime = _contractStartTime;
        _devFee = 400;
    }

    /**
     * @dev Return value of reward period
     */
    function rewardPeriod() external view returns (uint256) {
        return _rewardPeriod;
    }

    /**
     * @dev Return contract started time
     */
    function contractStartTime() external view returns (uint256) {
        return _contractStartTime;
    }

    /**
     * @dev Change value of reward period. Call by only Governance.
     */
    function changeRewardPeriod(uint256 rewardPeriod_) external onlyGovernance {
        _rewardPeriod = rewardPeriod_;
        emit ChangedRewardPeriod(governance(), rewardPeriod_);
    }

    /**
     * @dev Return address of NEON-ETH Uniswap V2 pair
     */
    function uniswapV2Pair() external view returns (address) {
        return _uniswapV2Pair;
    }

    /**
     * @dev Change NEON-ETH Uniswap V2 Pair address. Call by only Governance.
     */
    function changeUniswapV2Pair(address uniswapV2Pair_) external onlyGovernance {
        _uniswapV2Pair = uniswapV2Pair_;
        emit ChangedUniswapV2Pair(governance(), uniswapV2Pair_);
    }

    /**
     * @dev Return address of NEON Token contract
     */
    function neonAddress() external view returns (address) {
        return _neonAddress;
    }

    /**
     * @dev Change NEON Token contract address. Call by only Governance.
     */
    function changeNeonAddress(address neonAddress_) external onlyGovernance {
        _neonAddress = neonAddress_;
        emit ChangedNeonAddress(governance(), neonAddress_);
    }

    /**
     * @dev Return address of dev fee receiver
     */
    function devFeeReciever() external view returns (address) {
        return _devAddress;
    }

    /**
     * @dev Update dev address by the previous dev.
     * Note onlyOwner functions are meant for the governance contract
     * allowing NEON governance token holders to do this functions.
     */
    function changeDevFeeReciever(address devAddress_) external onlyGovernance {
        address oldAddress = _devAddress;
        _devAddress = devAddress_;
        emit changedDevFeeReciever(governance(), oldAddress, _devAddress);
    }

    /**
     * @dev Return dev fee
     */
    function devFee() external view returns (uint16) {
        return _devFee;
    }

    /**
     * @dev Update the dev fee for this contract
     * defaults at 4.00%
     * Note contract owner is meant to be a governance contract allowing NEON governance consensus
     */
    function changeDevFee(uint16 devFee_) external onlyGovernance {
        require(_devFee <= 1000, 'Dev fee clamped at 10%');
        _devFee = devFee_;
    }

    /**
     * @dev Add fee to epoch reward variable
     * Note Call by only NEON token contract
     */
    function addEpochReward(uint256 amount_) external onlyNeon returns (bool) {
        uint256 blockTime = block.timestamp;

        if (blockTime.sub(_lastRewardedTime) >= _rewardPeriod) {
            uint256 currentTime = _lastRewardedTime.add(_rewardPeriod);
            _epochRewards[currentTime] = _epochRewards[currentTime].add(amount_);
            _lastRewardedTime = currentTime;
        } else {
            _epochRewards[_lastRewardedTime] = _epochRewards[_lastRewardedTime].add(amount_);
        }

        return true;
    }

    /**
     * @dev Stake NEON-ETH LP tokens
     */
    function stake(uint256 amount_) external {
        require(!_isContract(_msgSender()), "Could not be a contract");
        require(amount_ > 0, "Staking amount must be more than zero");

        // Transfer tokens from staker to the contract amount
        require(
            IUIV2PAIR(_uniswapV2Pair).transferFrom(
            _msgSender(),
            address(this), 
            amount_), 
            "It has failed to transfer tokens from staker to contract."
        );
        
        // Increase the total staked amount
        _totalStakedAmount = _totalStakedAmount.add(amount_);

        // Increase epoch staked amount
        _epochTotalStakedAmounts[_lastRewardedTime] = _epochTotalStakedAmounts[_lastRewardedTime].add(amount_);
        
        if (_userStartedTimes[_msgSender()] == 0) {
            _userStartedTimes[_msgSender()] = _lastRewardedTime;
        }

        // Increase staked amount of the staker
        _userEpochStakedAmounts[_lastRewardedTime][_msgSender()] = _userEpochStakedAmounts[_lastRewardedTime][_msgSender()].add(amount_);
        _userTotalStakedAmounts[_msgSender()] = _userTotalStakedAmounts[_msgSender()].add(amount_);

        emit Staked(_msgSender(), amount_);
    }

    /**
     * @dev Unstake staked NEON-ETH LP tokens
     */
    function unstake() external {
        require(!_isContract(_msgSender()), "Could not be a contract");
        uint256 amount = _userTotalStakedAmounts[_msgSender()];
        require(amount > 0, "No running stake");

        // Transfer LP tokens from contract to staker
        require(
            IUIV2PAIR(_uniswapV2Pair).transfer(
            _msgSender(), 
            amount), 
            "It has failed to transfer tokens from contract to staker."
        );
        _withdrawReward();

        // Decrease the total staked amount
        _totalStakedAmount = _totalStakedAmount.sub(amount);
        _userTotalStakedAmounts[_msgSender()] = _userTotalStakedAmounts[_msgSender()].sub(amount);

        // Decrease the staker's amount
        uint256 blockTime = block.timestamp;
        uint256 startedTime = _userStartedTimes[_msgSender()];
        uint256 n = blockTime.sub(startedTime).div(_rewardPeriod);

        for (uint256 i = 0; i < n; i++) {
            uint256 rewardTime = startedTime.add(_rewardPeriod.mul(i));
            _userEpochStakedAmounts[rewardTime][_msgSender()] = 0;
        }
        // Initialize started time of user
        _userStartedTimes[_msgSender()] = 0;

        emit Unstaked(_msgSender(), amount);
    }
    
    /**
     * @dev API to get staker's reward
     */
    function getReward() public view returns (uint256) {
        require(!_isContract(_msgSender()), "Could not be a contract");

        uint256 reward = 0;
        uint256 blockTime = block.timestamp;
        uint256 startedTime = _userStartedTimes[_msgSender()];

        if (startedTime > 0) {
            uint256 n = blockTime.sub(startedTime).div(_rewardPeriod);

            for (uint256 i = 0; i < n; i++) {
                uint256 rewardTime = startedTime.add(_rewardPeriod.mul(i));
                uint256 epochRewards = _epochRewards[rewardTime];
                uint256 epochTotalStakedAmounts = _epochTotalStakedAmounts[rewardTime];
                uint256 stakedAmount = _userEpochStakedAmounts[rewardTime][_msgSender()];
                reward = stakedAmount.mul(epochRewards).div(epochTotalStakedAmounts).add(reward);
            }
        }

        return reward;
    }

    /**
     * @dev API to withdraw rewards to staker's wallet
     */
    function withdrawReward() external returns (bool) {
        _withdrawReward();
        return true;
    }

    /**
     * @dev API to get the last rewarded time
     */
    function lastRewardedTime() external view returns (uint256) {
        return _lastRewardedTime;
    }

    /**
     * @dev API to get the epoch rewards
     */
    function epochReward(uint256 epoch_) external view returns (uint256) {
        return _epochRewards[epoch_];
    }

    /**
     * @dev API to get the total staked amount of all stakers
     */
    function totalStakedAmount() external view returns (uint256) {
        return _totalStakedAmount;
    }

    /**
     * @dev API to get the total epoch staked amount of all stakers
     */
    function epochTotalStakedAmount(uint256 epoch_) external view returns (uint256) {
        return _epochTotalStakedAmounts[epoch_];
    }

    /**
     * @dev API to get the staker's staked amount
     */
    function userTotalStakedAmount() external view returns (uint256) {
        return _userTotalStakedAmounts[_msgSender()];
    }

    /**
     * @dev API to get the staker's staked amount
     */
    function userEpochStakedAmount(uint256 epoch_) external view returns (uint256) {
        return _userEpochStakedAmounts[epoch_][_msgSender()];
    }

    /**
     * @dev API to get the staker's started time the staking
     */
    function userStartedTime(address account_) external view returns (uint256) {
        return _userStartedTimes[account_];
    }

     /**
     * @dev Withdraw NEON token from vault wallet to owner when only emergency!
     *
     */
    function emergencyWithdrawToken() external onlyGovernance {
        require(_msgSender() != address(0), "Invalid address");
        
        uint256 tokenAmount = INEON(_neonAddress).balanceOf(address(this));
        require(tokenAmount > 0, "Insufficient amount");

        INEON(_neonAddress).transferWithoutFee(_msgSender(), tokenAmount);
        emit EmergencyWithdrewToken(address(this), _msgSender(), tokenAmount);
    }

    /**
     * @dev Low level withdraw internal function
     */
    function _withdrawReward() internal {
        uint256 rewards = getReward();
        uint256 devFeeAmount = rewards.mul(uint256(_devFee)).div(10000);

        // Transfer reward tokens from contract to staker
        require(
            INEON(_neonAddress).transferWithoutFee(_msgSender(),
            rewards.sub(devFeeAmount)), 
            "It has failed to transfer tokens from contract to staker."
        );

        // Transfer devFee tokens from contract to devAddress
        require(
            INEON(_neonAddress).transferWithoutFee(_devAddress,
            devFeeAmount), 
            "It has failed to transfer tokens from contract to staker."
        );

        emit WithdrewReward(_msgSender(), rewards);
    }

    /**
     * @dev Internal function if address is contract
     */
    function _isContract(address address_) internal view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(address_) }
        return size > 0;
    }
}
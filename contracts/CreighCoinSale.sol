pragma solidity >=0.4.21 <0.6.0;

import "./CreighCoin.sol";

contract CreighCoinSale {
  address payable owner;
  CreighCoin public coinContract;
  uint256 public coinPrice;
  uint256 public coinsSold;

  event Sell(address _buyer, uint256 _amount);

  constructor(CreighCoin _coinContract, uint256 _coinPrice) public {
    owner = msg.sender;
    coinContract = CreighCoin(_coinContract);
    coinPrice = _coinPrice;
  }

  function multiply(uint x, uint y) internal pure returns (uint z) {
    require(y == 0 || (z = x * y) / y == x);
  }

  function buyCoins(uint256 _numberOfCoins) public payable {
    require(msg.value == multiply(_numberOfCoins, coinPrice));
    require(coinContract.balanceOf(address(this)) >= _numberOfCoins);
    require(coinContract.transfer(msg.sender, _numberOfCoins));

    coinsSold += _numberOfCoins;

    emit Sell(msg.sender, _numberOfCoins);
  }

  function getAddress() public view returns (address a) {
    return address(this);
  }

  function endSale() public {
    require(msg.sender == owner);
    require(coinContract.transfer(owner, coinContract.balanceOf(address(this))));
    /* selfdestruct(owner); */
  }
}

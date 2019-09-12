const CreighCoin = artifacts.require("./CreighCoin.sol");
const CreighCoinSale = artifacts.require("./CreighCoinSale.sol");

module.exports = function(deployer) {
  var initialSupply = "1100000";
  deployer.deploy(CreighCoin, initialSupply).then(function() {
    var coinPrice = "5000000000000000000";
    return deployer.deploy(CreighCoinSale, CreighCoin.address, coinPrice);
  });
};

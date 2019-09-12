var CreighCoin = artifacts.require("CreighCoin");
var CreighCoinSale = artifacts.require("CreighCoinSale");

contract('CreighCoinSale', function(accounts) {
  var coinInstance;
  var coinSaleInstance;
  var owner = accounts[0];
  var buyer = accounts[6];
  var coinPrice = "5000000000000000000";
  var coinsAvailable = 1000000;
  var numberOfCoins;

  it('initializes the contract with the correct values', function() {
    return CreighCoinSale.deployed().then(function(instance) {
      coinSaleInstance = instance;
      return coinSaleInstance.address;
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has contract address');
      return coinSaleInstance.coinContract();
    }).then(function(address) {
      assert.notEqual(address, 0x0, 'has contract address');
      return coinSaleInstance.coinPrice();
    }).then(function(price) {
      assert.equal(price, coinPrice, 'coin price is correct');
    });
  });

  it('facilitates coin buying', function() {
    return CreighCoin.deployed().then(function(instance) {
      coinInstance = instance;
      return CreighCoinSale.deployed();
    }).then(function(instance) {
      coinSaleInstance = instance;
      return coinInstance.transfer(coinSaleInstance.address, coinsAvailable, {from: owner});
    }).then(function(receipt) {
      return coinInstance.balanceOf(coinSaleInstance.address);
    }).then(function(coinSaleContractBalance) {
      assert.equal(coinSaleContractBalance.toNumber(), coinsAvailable, 'sale contract holds coinsAvailable');
      numberOfCoins = 2;
      return coinSaleInstance.buyCoins(numberOfCoins, {from: buyer, value: numberOfCoins * coinPrice});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers 1 event');
      assert.equal(receipt.logs[0].event, 'Sell', 'is the Sell event');
      assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the coins');
      assert.equal(receipt.logs[0].args._amount, numberOfCoins, 'logs the number of coins purchased');
      return coinSaleInstance.coinsSold();
    }).then(function(amount) {
      assert.equal(amount.toNumber(), numberOfCoins, 'increments the number of coins sold');
      return coinInstance.balanceOf(buyer);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), numberOfCoins, 'buyers receive coins');
      return coinInstance.balanceOf(coinSaleInstance.address);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), coinsAvailable - numberOfCoins, 'contract sends coins to buyers');
      return coinSaleInstance.buyCoins(numberOfCoins, {from: buyer, value: 1});
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of coins in wei');
      return coinSaleInstance.buyCoins(9999999, {from: buyer, value: numberOfCoins * coinPrice});
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer more coins than are available');
    });
  });

  it('ends coin sale', function() {
    return CreighCoin.deployed().then(function(instance) {
      coinInstance = instance;
      return CreighCoinSale.deployed();
    }).then(function(instance) {
      coinSaleInstance = instance;
      return coinSaleInstance.endSale({from: buyer});
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'must be owner to end sale');
      return coinSaleInstance.endSale({from: owner});
    }).then(function(receipt) {
      return coinInstance.balanceOf(owner);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 1099998, 'returns all unsold coins to owner');
      return coinSaleInstance.coinPrice();
    });
  });
});

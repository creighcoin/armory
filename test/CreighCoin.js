var CreighCoin = artifacts.require("CreighCoin");

contract('CreighCoin', function(accounts) {
  var coinInstance;

  it('initializes the contract with the correct values', function() {
    return CreighCoin.deployed().then(function(instance) {
      coinInstance = instance;
      return coinInstance.name();
    }).then(function(name) {
      assert.equal(name, 'CreighCoin', 'has the correct name');
      return coinInstance.symbol();
    }).then(function(symbol) {
      assert.equal(symbol, 'CC', 'has the correct symbol');
      return coinInstance.version();
    }).then(function(version) {
      assert.equal(version, "CreighCoin v1.0", 'has the correct version');
    });
  });

  it('allocates the totalSupply upon deployment', function() {
    return CreighCoin.deployed().then(function(instance) {
      coinInstance = instance;
      return coinInstance.totalSupply();
    }).then(function(totalSupply) {
      assert.equal(totalSupply.toNumber(), 1100000, 'sets the total supply to 1000000');
      return coinInstance.balanceOf(accounts[0]);
    }).then(function(ownerBalance) {
      assert.equal(ownerBalance.toNumber(), 1100000, 'allocates the inital balance of 1000000 to the ownerAccount');
    });
  });

  it('allows coin transfers', function() {
    return CreighCoin.deployed().then(function(instance) {
      coinInstance = instance;
      return coinInstance.transfer.call(accounts[1], 9999999, {from: accounts[0]});
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
      return coinInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
    }).then(function(success) {
      assert.equal(success, true, 'it returns true');
      return coinInstance.transfer(accounts[1], 250000, {from: accounts[0]});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers 1 event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'is the Transfer event');
      assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the coins are transferred from');
      assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the coins are transferred to');
      assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer value');
      return coinInstance.balanceOf(accounts[1]);
    }).then(function(account1Balance) {
      assert.equal(account1Balance.toNumber(), 250000, 'transfers 250000 in');
      return coinInstance.balanceOf(accounts[0]);
    }).then(function(ownerBalance) {
      assert.equal(ownerBalance.toNumber(), 850000, 'transfers 250000 out')
    });
  });

  it('approves coins for delegated transfer', function() {
    return CreighCoin.deployed().then(function(instance) {
      coinInstance = instance;
      return coinInstance.approve.call(accounts[1], 100);
    }).then(function(success) {
      assert.equal(success, true, 'returns true');
      return coinInstance.approve(accounts[1], 100, {from: accounts[0]});
    }).then(function(receipt) {
        assert.equal(receipt.logs.length, 1, 'triggers 1 event');
        assert.equal(receipt.logs[0].event, 'Approval', 'is the Approval event');
        assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the coins are transferred from');
        assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the coins are transferred to');
        assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer value');
        return coinInstance.allowance(accounts[0], accounts[1]);
    }).then(function(allowance) {
      assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
    });
  });

  it('handles delegated coin transfers', function() {
    return CreighCoin.deployed().then(function(instance) {
      coinInstance = instance;
      fromAccount = accounts[2];
      toAccount = accounts[3];
      spendingAccount = accounts[4];
      return coinInstance.transfer(fromAccount, 100, {from: accounts[0]});
    }).then(function(receipt) {
      return coinInstance.approve(spendingAccount, 10, {from: fromAccount});
    }).then(function(receipt) {
      return coinInstance.transferFrom(fromAccount, toAccount, 999, {from: spendingAccount});
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
      return coinInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount});
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
      return coinInstance.transferFrom.call(fromAccount, toAccount, 10, {from: spendingAccount});
    }).then(function(success) {
      assert.equal(success, true, 'can transfer a value approved for transfer');
      return coinInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount});
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers 1 event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'is the Transfer event');
      assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the coins are transferred from');
      assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the coins are transferred to');
      assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer value');
      return coinInstance.balanceOf(fromAccount);
    }).then(function(fromAccountBalance) {
      assert.equal(fromAccountBalance.toNumber(), 90, 'deducts the amount from the sending account');
      return coinInstance.balanceOf(toAccount);
    }).then(function(toAccountBalance) {
      assert.equal(toAccountBalance.toNumber(), 10, 'deducts the amount from the sending account');
      return coinInstance.balanceOf(spendingAccount);
    }).then(function(spendingAccountBalance) {
      assert.equal(spendingAccountBalance.toNumber(), 0, 'deducts the amount from the allowance');
    });
  });
});

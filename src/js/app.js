App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  coinPrice: "5",
  coinsAvailable: "1000000",

  init: function() {
    ethereum.autoRefreshOnNetworkChange = false;
    // console.log("App initialized...");
    $('#coin-price').html(App.coinPrice);
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // Metamask
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Default instance
      App.web3Provider = new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/dc8d0aa8775f43c9b1525322136435dd');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("CreighCoinSale.json", function(creighCoinSale) {
      App.contracts.CreighCoinSale = TruffleContract(creighCoinSale);
      App.contracts.CreighCoinSale.setProvider(App.web3Provider);
      App.contracts.CreighCoinSale.deployed().then(function(creighCoinSale) {
        // console.log("Creigh Coin Sale Address:", creighCoinSale.address);
      });
    }).done(function() {
      $.getJSON("CreighCoin.json", function(creighCoin) {
        App.contracts.CreighCoin = TruffleContract(creighCoin);
        App.contracts.CreighCoin.setProvider(App.web3Provider);
        App.contracts.CreighCoin.deployed().then(function(creighCoin) {
          // console.log("Creigh Coin Address:", creighCoin.address);
        });
      }).done(function() {
        // App.listenForEvents();
        return App.render();
      });
    });
  },

  // listenForEvents: function() { // Cannot listen for accounts without setting up websocket
  //   App.contracts.CreighCoinSale.Sell().on('data', function(event) {
  //       App.render();
  //   });
  // },

  render: function() {
    if(App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();
    // Load account data
    window.ethereum.enable().then((account) =>{
      const defaultAccount = account[0];
      web3.eth.defaultAccount = defaultAccount;

      App.account = web3.eth.defaultAccount;
      $('#accountAddress').html("Your Account: " + App.account);
      // console.log("Account: ", web3.eth.defaultAccount);
      web3.eth.getBalance(web3.eth.defaultAccount).then((balance) => {
        // console.log("Account Balance: ", web3.utils.fromWei(balance, "ether"));
        $('#accountBalance').html(web3.utils.fromWei(balance, "ether"));
      });

      App.contracts.CreighCoin.deployed().then(function(instance) {
        CreighCoinInstance = instance;
        return CreighCoinInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('#cc-balance').html(balance.toNumber());
        return CreighCoinInstance.balanceOf(App.contracts.CreighCoinSale.address);
      }).then(function(balance) {
        App.coinsAvailable = balance.toNumber();
        return App.contracts.CreighCoinSale.deployed();
      }).then(function(instance) {
        creighCoinSaleInstance = instance;
        return creighCoinSaleInstance.coinPrice();
      }).then(function(coinPrice) {
        App.coinPrice = coinPrice;
        $('#coin-price').html(web3.utils.fromWei(App.coinPrice, "ether"));
        return creighCoinSaleInstance.coinsSold();
      }).then(function(coinsSold) {
        App.coinsAvailable += coinsSold.toNumber();
        $('#coinsAvailable').html(App.coinsAvailable);

        App.coinsSold = coinsSold.toNumber();
        $('#coinsSold').html(App.coinsSold);

        var progressPercent = (App.coinsSold / App.coinsAvailable) * 100;
        $('#progress').css('width', progressPercent + '%');

        App.loading = false;

        loader.hide();
        content.show();
      });
    });
  },

  buyCoins: function() {
    // $('#content').hide();
    // $('#loader').show();
    var numberOfCoins = $('#numberOfCoins').val();
    App.contracts.CreighCoinSale.deployed().then(function(instance) {
      return instance.buyCoins(numberOfCoins, {
        from: App.account,
        value: numberOfCoins * App.coinPrice,
        gas: 500000
      }).then(function(result) {
        // console.log("Coins bought...");
      });
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  });
});

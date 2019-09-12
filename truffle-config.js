var HDWalletProvider = require("@truffle/hdwallet-provider");

var mnemonic = "";

module.exports = {
  networks: {
    // Test network
    ethereum: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/<infura-id>")
      },
      network_id: 4
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.10"
    }
  }
}

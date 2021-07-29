# ecosytem-provider
apply EIP1139 - create provider connect dapps ecosystem


- Convert ethereum provider library from node js to javascript library for browser only.
management signer.

- Simple provider to management "wallet" accounts and network using connect with DAPPs base on EIP1139 common convention for ecosystem.

- Event Emitter for listen event emitted.

# Requirement

`` import require.js library ``
then

`` import index.js file ``

# Usage
- create ethereum provider

``window.ethereum = new window.CustomWallet($URL_RPC, $PRIVATE_KEY, {chainId: $CHAIN_ID})``

- change account connect

`` window.ethereum.setAccount($PRIVATE_KEY)``

- change account connect

`` window.ethereum.setAccount($URL_RPC, $CHAIN_ID)``

- Request accounts ~~ "window.ethereum.enable()"
`` window.ethereum.request({method: "eth_requestAccounts"}) ``

- Listen event : connect, disconnect, chainChanged, accountsChanged, message 

`` window.ethereum.on("accountsChanged", function() {_}) ``
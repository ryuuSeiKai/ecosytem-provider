/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
require(["https://cdn.ethers.io/scripts/ethers-v4.min.js", 
    "https://cdn.jsdelivr.net/npm/web3js-cdn@1.3.0/web3.min.js", 
    "https://bundle.run/buffer@6.0.3"
    ], function (ethers, Web3, buffer) {
    // const Buffer = buffer.Buffer;
    const Buffer = buffer.Buffer;
    let aggregation = (baseClass, ...mixins) => {
      let base = class _Combined extends baseClass {
          constructor (...args) {
              super(...args);
              mixins.forEach((mixin) => {
                  mixin.prototype.initializer.call(this);
              });
          }
      };
      let copyProps = (target, source) => {
          Object.getOwnPropertyNames(source)
              .concat(Object.getOwnPropertySymbols(source))
              .forEach((prop) => {
              if (prop.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/))
                  return;
              Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
          });
      };
      mixins.forEach((mixin) => {
          copyProps(base.prototype, mixin.prototype);
          copyProps(base, mixin);
      });
      return base;
    };

    let Web3HttpProvider = Web3.providers.HttpProvider;
    let isUtf8 = function (text) {
        var utf8Text = text;
        try {
            // Try to convert to utf-8
            utf8Text = decodeURIComponent(escape(text));
            // If the conversion succeeds, text is not utf-8
        }catch(e) {
            // console.log(e.message); // URI malformed
            // This exception means text is utf-8
        }   
        return utf8Text; // returned text is always utf-8
    }
    class ProviderRpcError extends Error {
        constructor(code, message) {
            super();
            this.code = code;
            this.message = message;
        }
        
        toString() {
            return `${this.message} (${this.code})`;
        }
    }
    class Utils {
        static genId() {
            return new Date().getTime() + Math.floor(Math.random() * 1000);
        }
    
        static flatMap(array, func) {
            return [].concat(...array.map(func));
        }
    
        static intRange(from, to) {
            if (from >= to) {
            return [];
            }
            return new Array(to - from).fill().map((_, i) => i + from);
        }
    
        static hexToInt(hexString) {
            if (hexString === undefined || hexString === null) {
            return hexString;
            }
            return Number.parseInt(hexString, 16);
        }
    
        static intToHex(int) {
            if (int === undefined || int === null) {
            return int;
            }
            let hexString = int.toString(16);
            return "0x" + hexString;
        }
    
        // message: Bytes | string
        static messageToBuffer(message) {
            var buffer;
            if ((typeof (message) === "string")) {
            buffer = Buffer.from(message.replace("0x", ""), "hex");
            } else {
            buffer = Buffer.from(message);
            }
            return buffer;
        }
    
        static bufferToHex(buf) {
            return "0x" + Buffer.from(buf).toString("hex");
        }
    }
    class IdMapping {
        constructor() {
            this.intIds = new Map;
        }
    
        tryIntifyId(payload) {
            if (!payload.id) {
            payload.id = Utils.genId();
            return;
            }
            if (typeof payload.id !== "number") {
            let newId = Utils.genId();
            this.intIds.set(newId, payload.id);
            payload.id = newId;
            }
        }
    
        tryRestoreId(payload) {
            let id = this.tryPopId(payload.id);
            if (id) {
            payload.id = id;
            }
        }
    
        tryPopId(id) {
            let originId = this.intIds.get(id);
            if (originId) {
            this.intIds.delete(id);
            }
            return originId;
        }
    }

    class EventEmitter {
        initializer(){
            this.events = {};
        }
    
        on(event, cb){
            if(!this.events[event]) this.events[event] = [];
            this.events[event].push(cb);
        }
    
        emit(event, data){
            let cbs = this.events[event];
            if(cbs){
                cbs.forEach(cb => cb(data));
            }
        }
    }

    class CustomHttpProvider extends aggregation(Web3HttpProvider, EventEmitter) {}
    
    // EIP1139 
    // emit event : connect, disconnect, chainChanged, accountsChanged, message


    var CustomProvider = function(host, privateKey = null, config = {}) {
        // set config
        this.chainId = config.chainId || '';

        this.host = host || "http://localhost:8545'";
        this.idMapping = new IdMapping();
        this.callbacks = new Map();
        this.wrapResults = new Map();
        this.setAccount(privateKey);
    };

    CustomProvider.prototype.setAddress = function(address) {
      const lowerAddress = (address || "");
      this.address = lowerAddress;
      this.ready = !!address;
      for (var i = 0; i < window.frames.length; i++) {
        const frame = window.frames[i];
        if (frame.ethereum && frame.ethereum.isTrust) {
          frame.ethereum.address = lowerAddress;
          frame.ethereum.ready = !!address;
        }
      }
    }
    // CustomProvider.prototype.disconnect = function() {

    // }

    CustomProvider.prototype.connected = false;

    CustomProvider.prototype.isConnected = function() {
      return this.connected;
    }
    
    CustomProvider.prototype = new CustomHttpProvider(this.host);

    CustomProvider.prototype.enable = function() {
      console.log(
        'enable() is deprecated, please use window.ethereum.request({method: "eth_requestAccounts"}) instead.'
      );
      return this.request({ method: "eth_requestAccounts", params: [] });
    }

    CustomProvider.prototype.emitConnect = function(chainId) {
     if (!this.connected) {
      this.connected = true;
      this.emit("connect", { chainId: chainId });
     }
    }

    CustomProvider.prototype.getSigner = function() {
      return this._signer;
    };
    
    CustomProvider.prototype.getAddress = function() {
      return this._signer.signingKey.address;
    };

    CustomProvider.prototype.setAccount = function (privateKey, emit = false) {
      this._signer = new ethers.Wallet(privateKey, this);
      this._privateKey = privateKey;
      // this.setAddress(this._signer.);
      if (emit)
        this.emitConnect();
        this.emit("accountsChanged", this.eth_accounts());
    };

    CustomProvider.prototype.setNetwork = function (rpc, chainId ,emit = false) {
      var that = this;
      that = new CustomHttpProvider(this.rpc);
      this.host = rpc;
      this.chainId = chainId;
      this.setAccount(this._privateKey);
      if (emit) 
        this.emitConnect();
        this.emit("chainChanged", this.eth_chainId());
    };
    
    CustomProvider.prototype.request = function(payload) {
      // this points to window in methods like web3.eth.getAccounts()
      var that = this;
      if (!(this instanceof CustomProvider)) {
        that = window.ethereum;
      }
      return this._request(payload, false);
    };

    /**
     * @deprecated Use request() method instead.
     */
    CustomProvider.prototype.send = function(payload) {
      let response = { jsonrpc: "2.0", id: payload.id };
      switch (payload.method) {
        case "eth_accounts":
          response.result = this.eth_accounts();
          break;
        case "eth_coinbase":
          response.result = this.eth_coinbase();
          break;
        case "net_version":
          response.result = this.net_version();
          break;
        case "eth_chainId":
          response.result = this.eth_chainId();
          break;
        default:
          throw new ProviderRpcError(
            4200,
            `CustomProvider does not support calling ${payload.method} synchronously without a callback. Please provide a callback parameter to call ${payload.method} asynchronously.`
          );
      }
      return response;
    }

    /**
     * @deprecated Use request() method instead.
     */
     CustomProvider.prototype.sendAsync = function(payload, callback) {
      console.log(
        "sendAsync(data, callback) is deprecated, please use window.ethereum.request(data) instead."
      );
      // this points to window in methods like web3.eth.getAccounts()
      var that = this;
      if (!(this instanceof CustomProvider)) {
        that = window.ethereum;
      }
      if (Array.isArray(payload)) {
        Promise.all(payload.map(that._request.bind(that)))
          .then((data) => callback(null, data))
          .catch((error) => callback(error, null));
      } else {
        that
          ._request(payload)
          .then((data) => callback(null, data))
          .catch((error) => callback(error, null));
      }
    }
    
    CustomProvider.prototype._request = function(payload, wrapResult = true) {
      this.idMapping.tryIntifyId(payload);
      if (this.isDebug) {
        console.log(`==> _request payload ${JSON.stringify(payload)}`);
      }
      return new Promise((resolve, reject) => {
        if (!payload.id) {
          payload.id = Utils.genId();
        }
        this.callbacks.set(payload.id, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
        this.wrapResults.set(payload.id, wrapResult);
    
        switch (payload.method) {
          case "eth_requestAccounts":
          case "eth_accounts":
            return this.sendResponse(payload.id, this.eth_accounts());
          case "eth_coinbase":
            return this.sendResponse(payload.id, this.eth_coinbase());
          case "net_version":
            return this.sendResponse(payload.id, this.net_version());
          case "eth_chainId":
            return this.sendResponse(payload.id, this.eth_chainId());
          case "eth_sign":
            return this.eth_sign(payload);
          case "personal_sign":
            return this.personal_sign(payload);
          case "personal_ecRecover":
            return this.personal_ecRecover(payload);
          case "eth_signTypedData_v3":
            return this.eth_signTypedData(payload, Utils.SignTypedDataVersion.V3);
          case "eth_signTypedData":
          case "eth_signTypedData_v4":
            return this.eth_signTypedData(payload, Utils.SignTypedDataVersion.V4);
          case "eth_sendTransaction":
            return this.eth_sendTransaction(payload);
            // return this.eth_requestAccounts(payload);
          case "wallet_watchAsset":
            return this.wallet_watchAsset(payload);
          case "wallet_addEthereumChain":
            return this.wallet_addEthereumChain(payload);
          case "eth_newFilter":
          case "eth_newBlockFilter":
          case "eth_newPendingTransactionFilter":
          case "eth_uninstallFilter":
          case "eth_subscribe":
            throw new ProviderRpcError(
              4200,
              `Does not support calling ${payload.method}. Please use your own solution`
            );
          default:
            // call upstream rpc
            this.callbacks.delete(payload.id);
            this.wrapResults.delete(payload.id);
            return this.rpc
              .call(payload)
              .then((response) => {
                if (this.isDebug) {
                  console.log(`<== rpc response ${JSON.stringify(response)}`);
                }
                wrapResult ? resolve(response) : resolve(response.result);
              })
              .catch(reject);
        }
      });
    };
    
    CustomProvider.prototype.eth_requestAccounts = function(payload) {
      this.postMessage("requestAccounts", payload.id, this.eth_accounts());
    };
    
    CustomProvider.prototype.eth_accounts = function() {
      return this._signer.signingKey.address ? [this._signer.signingKey.address] : [];
    };
    
    CustomProvider.prototype.eth_coinbase = function() {
      return this._signer.signingKey.address;
    };
    
    CustomProvider.prototype.net_version = function() {
      return this.chainId.toString(10) || null;
    };
    
    CustomProvider.prototype.eth_chainId = function() {
      return "0x" + this.chainId.toString(16);
    };
    
    CustomProvider.prototype.eth_sign = function(payload) {
      const buffer = Utils.messageToBuffer(payload.params[1]);
      const hex = Utils.bufferToHex(buffer);
      if (isUtf8(buffer)) {
      this.postMessage("signPersonalMessage", payload.id, { data: hex });
      } else {
      this.postMessage("signMessage", payload.id, { data: hex });
      }
    };
    
    CustomProvider.prototype.personal_sign = function(payload) {
      const message = payload.params[0];
      const buffer = Utils.messageToBuffer(message);
      if (buffer.length === 0) {
      // hex it
      const hex = Utils.bufferToHex(message);
      this.postMessage("signPersonalMessage", payload.id, { data: hex });
      } else {
      this.postMessage("signPersonalMessage", payload.id, { data: message });
      }
    };
    
    CustomProvider.prototype.personal_ecRecover = function(payload) {
        this.postMessage("ecRecover", payload.id, {
        signature: payload.params[1],
        message: payload.params[0],
        });
    };
    
    CustomProvider.prototype.eth_signTypedData = function(payload, _useV4) {
        const message = JSON.parse(payload.params[1]);
        const hash = "";
        this.postMessage("signTypedMessage", payload.id, {
        data: "0x" + hash.toString("hex"),
        raw: payload.params[1],
        });
    };
    
    CustomProvider.prototype.eth_sendTransaction = function(payload) {
        this.postMessage("signTransaction", payload.id, payload.params[0]);
    };
    
    CustomProvider.prototype.eth_requestAccounts = function(payload) {
        this.postMessage("requestAccounts", payload.id,this.eth_accounts());
    };
    
    CustomProvider.prototype.wallet_watchAsset = function(payload) {
        let options = payload.params.options;
        this.postMessage("watchAsset", payload.id, {
          type: payload.type,
          contract: options.address,
          symbol: options.symbol,
          decimals: options.decimals || 0,
        });
    };
    
    CustomProvider.prototype.wallet_addEthereumChain = function(payload) {
      this.postMessage("addEthereumChain", payload.id, payload.params[0]);
    };

    CustomProvider.prototype.wallet_switchEthereumChain = function(payload) {
      this.postMessage("switchEthereumChain", payload.id, payload.params[0]);
    };
    
    /**
     * @private Internal js -> native message handler
     */
    CustomProvider.prototype.postMessage = function(handler, id, data) {
      if (this.ready || handler === "requestAccounts") {
        let object = {
          id: id,
          name: handler,
          data: data,
        };
        if (window.CustomWallet.postMessage) {
          window.CustomWallet.postMessage(object);
        } else {
          // old clients
          // window.webkit.messageHandlers[handler].postMessage(object);
        }
      } else {
        // don't forget to verify in the app
        this.sendError(id, new ProviderRpcError(4100, "provider is not ready"));
      }
    };
    
    /**
     * @private Internal native result -> js
     */
    CustomProvider.prototype.sendResponse = function(id, result) {
      let originId = this.idMapping.tryPopId(id) || id;
      let callback = this.callbacks.get(id);
      let wrapResult = this.wrapResults.get(id);
      let data = { jsonrpc: "2.0", id: originId };
      if (typeof result === "object" && result.jsonrpc && result.result) {
        data.result = result.result;
      } else {
        data.result = result;
      }
      if (this.isDebug) {
        console.log(
          `<== sendResponse id: ${id}, result: ${JSON.stringify(
            result
          )}, data: ${JSON.stringify(data)}`
        );
      }
      if (callback) {
        wrapResult ? callback(null, data) : callback(null, result);
        this.callbacks.delete(id);
      } else {
        console.log(`callback id: ${id} not found`);
        // check if it's iframe callback
        for (var i = 0; i < window.frames.length; i++) {
          const frame = window.frames[i];
          try {
            if (frame.ethereum.callbacks.has(id)) {
              frame.ethereum.sendResponse(id, result);
            }
          } catch (error) {
            console.log(`send response to frame error: ${error}`);
          }
        }
      }
    };

    window.CustomWallet = {
        Provider: CustomProvider,
        Web3: Web3,
        postMessage: (rs) => window.ethereum.sendResponse(rs.id, rs.data),
    };
  
  })
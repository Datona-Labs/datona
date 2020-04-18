# Datona CLI

[![NPM](https://img.shields.io/npm/v/datona-cli)](https://www.npmjs.org/package/datona-cli)

Datona Command Line Interface.  A node.js wrapper for the [datona-lib](https://github.com/Datona-Labs/datona-lib) library providing developers with command line functions to experiment with the [Datona IO Platform](https://datona.io).  Full documentation for datona-lib can be found [here](https://datona-lib.readthedocs.io/en/latest/index.html).

## New To Smart Data Access?

See [What Is Smart Data Access](https://datona-lib.readthedocs.io/en/latest/what.html), or for more detail read the [technical white paper](http://datonalabs.org/documents/WhitePaper.pdf).

## Features
- create and manage a basic wallet of private keys
- get [Smart Data Access Requests](https://datona-lib.readthedocs.io/en/latest/types.html#smart-data-access-request-protocol) from public restful APIs and generate [Smart Data Access Responses](https://datona-lib.readthedocs.io/en/latest/types.html#smartdataaccessresponse)
- deploy and manage Smart Data Access Contracts on the blockchain
- create, update, access and delete Data Vaults on local or remote vault servers

Datona is built using [datona-lib](https://github.com/datona-labs/datona-lib).

## Prerequisites

- [node](https://nodejs.org/en/)

### Install Datona
Open a terminal window then type:
```
$ npm install datona-cli -g
```
This will install the Datona command line client and all its dependencies.

## Using Datona for the First Time

### Configuration

The datona-lib library must be told how to access the blockchain network.  At this time the kovan testnet is supported.  To access the network you will either need to be running your own kovan node or use a third party account service like [Infura](https://infura.io).

To configure, edit /usr/local/lib/node_modules/datona-cli/config.json
  
E.g.

```
{
    "blockchainURL" : {
      "scheme": "https",
      "host": "kovan.infura.io/v3/<YOUR PROJECT ID>",
      "port": ""
    }
}
```

### Create a Private Key

From the command prompt generate a default key
```
$ datona generateKey
```
or save an existing key. For example:
```
$ datona saveKey 4b4d6874407e35f2d123c6e09bf263df227d48ea3924acfdbf47162d0bb55eb3
```

Keys are placed in the ~/.datona folder. This will be the default key used to sign blockchain, vault and Requester response transactions.

### Fund Your Address

To use the kovan testnet you will need to use a faucet to fund your address with some KETH, e.g. https://faucet.kovan.network/.

## Usage

```
Usage: datona <command> [options] [args]   # Try datona <command> --help

Options:
  -V, --version  output the version number
  -h, --help     output usage information
  -k, --key      name of the private key to use (see datona generateKey --help)

Commands:

  generateKey [options] [name]
    generates a new private key and stores it in the ~/.datona directory with the optional name.

  saveKey [options] <privateKey> [name]
    stores the given private key in the ~/.datona directory with the optional name.

  getAddress [name]
    displays the public address of the key with the given name. If no name is given the default key is used.

  getRequest [options] <url>
    gets a request from the given http restful api

  acceptRequest [options] <file> <contractAddr> <vaultUrl> <vaultAddr>
    accepts the given request by sending a Smart Data Access Response to the requester.

  deployContract [options] <file> <args...>
    deploys a contract to the blockchain with the given constructor args

  callContract <file> <contractAddr> <method> [args...]
    calls a specific view or pure method of a contract

  transactContract [options] <file> <contractAddr> <function> [args...]
    calls a specific state-modifying method of a contract

  terminateContract [options] <file> <contractAddr>
    terminates the contract at the given address

  createVault [options] <contractAddr> <vaultUrl> <vaultAddr> <data>
    creates a vault on the remote vault server controlled by the given contract

  updateVault [options] <contractAddr> <vaultUrl> <vaultAddr> <data>
    updates a vault on the remote vault server identified by the given contract

  accessVault [options] <contractAddr> <vaultUrl> <vaultAddr>
    accesses a vault on the remote vault server identified by the given contract

  deleteVault [options] <contractAddr> <vaultUrl> <vaultAddr>
    deletes a vault on the remote vault server identified by the given contract

```

## Example

*Before following this example, make sure you have followed the instructions in [Using Datona for the First Time](#Using-Datona-for-the-First-Time)*

This example follows the following scenario:

**As a Data Owner, receive and accept a Smart Data Access Request:**

1\. Download a Smart Data Access Request from Datona Labs;

2\. Deploy the requested [Duration_SDAC](#Duration_SDAC-Solidity-Code) smart contract to the kovan testnet;

3\. Create a new data vault on the datonavault.com cloud vault server;

4\. Inform Datona Labs that you've accepted the request;


**Explore vault permissions:**

5\. As the Requester, retrieve the data from the vault;

6\. As a different user, try to retrieve the data from the vault;

7\. As the Owner, update the data in the vault;

8\. As the Requester, retrieve the updated data from the vault;

9\. As any user, get information about the Smart Data Access Contract;


**Terminate the contract and explore permissions:**

10\. As a different user, try to terminate the Smart Data Access Contract

11\. As the Requester, retrieve the data from the vault;

12\. As the Owner, terminate the Smart Data Access Contract

13\. As the Requester, try to retrieve the data from the vault;

14\. As the Owner, try to retrieve the data from the vault;

15\. As a different user, try to delete the vault.

16\. As the Owner, delete the vault.


### First, let's setup some keys...

For ease of use later, we will setup named keys for the Owner, Requester and a random different user.  We will also record the vault owner's public address and Requester's public address.

The Owner's identity doesn't matter since the Smart Data Access Request is for anybody, but the Requester's identity must be the signatory of the request.  Normally the Owner and Requester will be different people but for this example we will pretend to be both.

```
# generate private keys

> datona generateKey owner
0xc16a409a39ede3f38e212900f8d3afe6aa6a8929

> datona saveKey e68e40257cfee330038c49637fcffff82fae04b9c563f4ea071c20f2eb55063c requester
0x41a60f71063cd7c9e5247d3e7d551f91f94b5c3b

> datona generateKey otherUser
0xb0402c1a2fe89117b1fda916a7f7a59612f41c7c


# record public keys

$ requester=`datona getAddress requester`
```

### Fund the addresses

You will need to send some of your KETH from your funded address to the Owner, Requester and Other User addresses.  Any Ethereum wallet should be able to do this.

### 1. Get a Smart Data Access Request from Datona Labs

A Smart Data Access Request is a JSON formatted string containing the contract to deploy and how to notify the Requester if you've accepted the request.  

Either:

Copy the following and paste into a file named ``request``:

```
{"txn":{"txnType":"SmartDataAccessRequest","version":"0.0.1","contract":{"hash":"5573012304cc4d87a7a07253c728e08250db6821a3dfdbbbcac9a24f8cd89ad4"},"api":{"url":{"scheme":"file","host":"77.68.75.133","port":8126},"acceptTransaction":{},"rejectTransaction":{}}},"signature":"93f05cbe7fce54df6195bbc1cbb7bc8bb0b11db699fdcfb3c1630d5bcf38ec961a5479534c6fc09537f65b022db36403cad6dac2108a12305c0cfe6a9f9c5a6801"}
```

or:

Download from the datonavault.com server at 77.68.75.133:

```
$ datona getRequest http://77.68.75.133:8125/0.0.1/durationRequest --raw >request
```

The ``request`` file will be used later.

The contract hash found in the request identifies the Smart Data Access Contract to be deployed (hash of its runtime bytecode). The contract is the terms and conditions that the Requester wants the Owner to accept and under which the Owner's data will be shared. In this case it is the Duration_SDAC smart contract. (The contract source code [can be found below](#duration_sdac-solidity-code)).

Let's store the contract hash for later:

```
$ contractHash=5573012304cc4d87a7a07253c728e08250db6821a3dfdbbbcac9a24f8cd89ad4
```

### 2. Deploy the requested Duration_SDAC smart contract to the kovan testnet

First we need the Duration_SDAC abi and bytecode. This can be found in datona-cli's ``contracts`` directory or can be downloaded from datonavault.com at 77.68.75.133.  Either way, let's create a variable pointing to it to make it easier later.  E.g.

```
$ contractCode=/usr/local/lib/node_modules/datona-cli/contracts/$contractHash
```
or
```
$ curl http://77.68.75.133:8125/0.0.1/contract/$contractHash > duration_sdac

$ contractCode=duration_sdac
```

Then we will deploy a new instance of the contract on the blockchain.  The contract's constructor takes two parameters: permittedRequester and contractDuration (in days).

```
$ datona deployContract $contractCode $requester 1 --key owner
0x073C8e6121eF67096c7925f7f9b2C66e3d240a74
```

The output address is the new contract's blockchain address, so we'll record that for later.
```
$ contract=0x073C8e6121eF67096c7925f7f9b2C66e3d240a74
```

Note, you can monitor your blockchain transactions on the [Kovan Block Explorer](https://kovan.etherscan.io/).

### 3. Create a new data vault on the datonavault.com cloud vault server

The Owner trusts the datonavault.com vault server so has decided to use that server to hold the data securely.  The Owner retrieves datonavault.com's public api and public address (used to authenticate transactions) from the datonavault.com website.  In future these may also be verified by a central authority.

Let's setup some variables to hold the vault url and the vault's public address.  

```
$ vaultUrl=file://77.68.75.133:8124
$ vaultServerId=0x288b32F2653C1d72043d240A7F938a114Ab69584
```

Now create the vault.

```
$ datona createVault $contract $vaultUrl $vaultServerId "Hello World" --key owner
{
  txn: {
    txnType: 'VaultResponse',
    responseType: 'success',
    data: {
      message: 'successfully created vault for contract 0x073C8e6121eF67096c7925f7f9b2C66e3d240a74',
      data: ''
    }
  },
  signatory: '0x288b32f2653c1d72043d240a7f938a114ab69584'
}
```

Note the signatory matches the vaultServerId above, in fact datona-lib has validated that as part of the transaction process.  If the signatory was wrong, an exception would have been thrown.

Behind the scenes the vault server received the create request, checked that the contract is on the blockchain and is owned by the transaction signatory then created a new vault containing the data.  The *VaultResponse* transaction returned was displayed as the output from the ``datona createVault`` command.

### 4. Inform Datona Labs that you've accepted the request

Now that the contract has been deployed and the vault created the Owner needs to inform the Requester of the contract address and where the data is held by sending a Smart Data Access Response.

```
$ datona acceptRequest request $contract $vaultUrl $vaultServerId --key owner
{
  txn: { txnType: 'GeneralResponse', responseType: 'success' },
  signatory: '0x288b32f2653c1d72043d240a7f938a114ab69584'
}
```

The request contains the url of the Requester's server so datona-lib knows where to send the response.

Behind the scenes the Requester's server received the Smart Data Access Response, checked that the correct contract was deployed on the blockchain (retrieved it's runtime bytecode from the blockchain and compared it's hash to the one in the original Smart Data Access Request) and checked that the transaction signatory was the owner of the contract.  It then recorded the contract address and vault address & url as a new customer.

### 5. As the Requester, retrieve the data from the vault

```
$ datona accessVault $contract $vaultUrl $vaultServerId --key requester
Hello World
```

Behind the scenes datona-lib sent a *VaultRequest* transaction to the vault server signed by the Requester's private key.  The vault server authenticated the signature in the VaultRequest and called the ``isPermitted`` method of the contract with the signatory recovered from the signature. This returned ``true`` so the vault server sent a *success VaultResponse* back with a copy of the data from the vault.

### 6. As a different user, try to retrieve the data from the vault

```
$ datona accessVault $contract $vaultUrl $vaultServerId --key otherUser
PermissionError - permission denied
```

The call to ``isPermitted`` for this user This returned ``false`` so the vault server sent an  *error VaultResponse* back containing a PermissionError.

### 7. As the Owner, update the data in the vault;

```
$ datona updateVault $contract $vaultUrl $vaultServerId "Hi World" --key owner
{
  txn: { txnType: 'VaultResponse', responseType: 'success' },
  signatory: '0x288b32f2653c1d72043d240a7f938a114ab69584'
}
```

At this time the Owner is free to update the data in the vault at any time.  In future, update permissions will be controlled by the smart contract too.

### 8. As the Requester, retrieve the updated data from the vault

```
$ datona accessVault $contract $vaultUrl $vaultServerId --key requester
Hi World
```

### 9. As any user, get information about the Smart Data Access Contract;

The smart contract developer controls who can access what methods of the Smart Data Access Contract.  In the case of the Duration_SDAC, all the ``view`` methods are unrestricted.

```
$ datona callContract $contractCode $contract isPermitted $requester
true

$ datona callContract $contractCode $contract hasExpired
false

$ datona callContract $contractCode $contract getOwner
0xc16a409a39ede3f38e212900f8d3afe6aa6a8929
```

### 10. As a different user, try to terminate the Smart Data Access Contract

```
$ datona terminateContract $contractCode $contract --key otherUser
BlockchainError - Transaction has been reverted by the EVM:
...
```

### 11. As the Requester, retrieve the data from the vault

```
$ datona accessVault $contract $vaultUrl $vaultServerId --key requester
Hi World
```

### 12. As the Owner, terminate the Smart Data Access Contract

```
$ datona terminateContract $contractCode $contract --key owner
{
  ...
  status: true,
  ...
}
```

This has terminated the contract on the blockchain. Once terminated the vault server will refuse all access to the vault.  

Note, the vault and its data will still exist until the vault server gets round to deleting it.  When it does this is down to the policy of the vault service but it is likely to be first time someone tries to access the vault or when the server runs a periodic check of the status of all contracts.  The Owner can force the vault server to delete the vault straight away by calling the deleteVault command.  We'll do that later.

### 13. As the Requester, try to retrieve the data from the vault

```
$ datona accessVault $contract $vaultUrl $vaultServerId --key requester
PermissionError - permission denied
```

### 14. As the Owner, try to retrieve the data from the vault

```
$ datona accessVault $contract $vaultUrl $vaultServerId --key owner
PermissionError - permission denied
```

### 15. As a different user, try to delete the vault

```
$ datona deleteVault $contract $vaultUrl $vaultServerId --key otherUser
ContractOwnerError - owner does not match
```

### 16. As the Owner, delete the vault

This forces the vault server to delete the vault and its data immediately.  It is not necessary to do this - the vault server will get round to it soon enough and the data cannot be accessed because the contract has been terminated.

```
$ datona deleteVault $contract $vaultUrl $vaultServerId --key owner
{
  txn: { txnType: 'VaultResponse', responseType: 'success' },
  signatory: '0x288b32f2653c1d72043d240a7f938a114ab69584'
}
```

This function will fail if the contract has not expired or been terminated.

### Conclusions

You should have now successfully put a Smart Data Access Request through its full life cycle: from downloading and accepting a request; through storing, updating and accessing the data; to terminating the contract and deleting the vault.  Along the way you acted as the requester accessing the vault and as an unwanted user trying (and failing) to access and manipulate the data.

Behind the scenes you have interfaced with four independent cloud servers: a requester's server to download the request; a second requester's server to inform them that you accepted their request; the vault server at datonavault.com to manage your vault; and a blockchain api service (Infura) to deploy, query and terminate your contract.

In a real-world deployment, each requester would have their own server and method of sending you a request, and there could be many hundreds of vault service providers and blockchain api providers to choose from.  You might also have your own vault server and blockchain api at home or use a friend's. 

## Duration_SDAC Solidity Code

The Duration S-DAC is used in the example above.  A JSON file containing its compiled ABI, bytecode and runtime bytecode is used in all calls to deployContract, callContract, transactContract and terminateContract.

The source code is compiled using v0.5.1 of the Byzantium compiler.  If making your own S-DAC, be sure to use that compiler and create a JSON file in the same format as those in the /usr/local/lib/node_modules/datona-cli/contracts/ folder.

```
pragma solidity ^0.5.1;

/*
 * Example of a basic Smart Information Contract
 */

contract SDAC {

    string public constant version = "0.0.1";

    // returns the owner of this contract
    function getOwner() public view returns (address);

    // basic permission.  Assumes the data vault has validated the requester's ID'
    function isPermitted( address requester ) public view returns (bool);

    // returns true if the contract has expired either automatically or manually
    function hasExpired() public view returns (bool);

    // terminates the contract if the sender is permitted and any termination conditions are met
    function terminate() public;

}


contract Duration_SDAC is SDAC {

    address public owner = msg.sender;
    address public permittedRequester;
    uint public contractDuration;
    uint public contractStart;
    bool terminated = false;


    modifier onlyOwnerOrRequester {
        require( msg.sender == owner || msg.sender == permittedRequester );
        _;
    }

    constructor( address _permittedRequester, uint _contractDuration ) public {
        permittedRequester = _permittedRequester;
        contractDuration = _contractDuration;
        contractStart = block.timestamp;
    }

    function isPermitted( address requester ) public view returns (bool) {
        return ( requester == permittedRequester ) &&
               ( ! hasExpired() );
    }

    function hasExpired() public view returns (bool) {
        return terminated ||
               (block.timestamp - contractStart) >= (contractDuration * 1 days);
    }

    function terminate() public onlyOwnerOrRequester {
        terminated = true;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

}
```

## Copyright

Datona (c) 2020 Datona Labs

Released under the [MIT license](LICENSE)

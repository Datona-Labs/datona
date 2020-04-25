# Datona CLI

[![NPM](https://img.shields.io/npm/v/datona-cli)](https://www.npmjs.org/package/datona-cli)

Datona Command Line Interface.  A node.js wrapper for the [datona-lib](https://github.com/Datona-Labs/datona-lib) library providing developers with command line functions to experiment with the [Datona IO Platform](https://datona.io).  Full documentation for datona-lib can be found [here](https://datona-lib.readthedocs.io/en/latest/index.html).

## New To Smart Data Access?

See [What Is Smart Data Access](https://datona-lib.readthedocs.io/en/latest/what.html), or for more detail read the [technical white paper](http://datonalabs.org/documents/WhitePaper.pdf).

## Features
- create and manage a basic wallet of private keys
- get [Smart Data Access Requests](https://datona-lib.readthedocs.io/en/latest/types.html#smart-data-access-request-protocol) from public restful APIs and generate [Smart Data Access Responses](https://datona-lib.readthedocs.io/en/latest/types.html#smartdataaccessresponse)
- deploy and manage Smart Data Access Contracts on the blockchain
- create, read, write, append and delete Data Vaults on local or remote vault servers

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

*When creating an account in Infura, it will ask you to create a new project.  You will need to copy the 16-byte (32 hex character) Project ID into the datona-cli configuration file below.*

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

Datona-cli contains a basic wallet. You can use it to randomly generate Ethereum private keys, which can be used to sign transactions later.

From the command prompt generate a default key.  This will be used by default to sign transactions:
```
$ datona generateKey
```
or you can store a private key you have already generated. For example:
```
$ datona saveKey 4b4d6874407e35f2d123c6e09bf263df227d48ea3924acfdbf47162d0bb55eb3
```

Private keys are placed in the ~/.datona folder.  You can only create one default key but you can create other keys by giving them each a unique name, e.g.:
```
$ datona generateKey mySecondKey
$ datona generateKey myThirdKey
$ datona generateKey myFourthKey
```

The output from the `generateKey` and `saveKey` commands is the public Ethereum address calculated from the private key.  You can view any of your addresses later with the `getAddress` command, for example:
```
$ datona getAddress
0x263ed87823a4ebfebcbd6ae275404a2ca877afb3

$ datona getAddress mySecondKey
0x636efe788b64c41a6b1c0f71e7c61abdac6213fd
```

### Fund Your Address

To deploy and transact with contracts on the blockchain and to run the examples below, you will need to fund your public Ethereum addresses.  You can use a public faucet like https://faucet.kovan.network/ to send yourself some KETH and a wallet like [MetaMask](https://metamask.io/) or [MyEtherWallet](https://www.myetherwallet.com/) to transfer KETH between all your addresses.

## Usage

```
Usage: datona <command> [options] [args]   # Try datona <command> --help

Options:

  -h, --help     output usage information
  -V, --version  output the version number
  -k, --key      name of the private key to use (see datona generateKey --help)

Commands:

  generateKey [options] [name]
    generates a new private key and stores it in the ~/.datona directory with the optional name. Outputs the key's public address.

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

  createVault [options] <contractAddr> <vaultUrl> <vaultAddr>
    creates a vault on the remote vault server controlled by the given contract

  writeVault [options] <contractAddr> <vaultUrl> <vaultAddr> <data>
    writes data to a vault on the remote vault server identified by the given contract.
    Use the option --file to write to a specific vault file.

  appendVault [options] <contractAddr> <vaultUrl> <vaultAddr> <data>
    appends data to a vault on the remote vault server identified by the given contract
    Use the option --file to append to a specific vault file.

  readVault [options] <contractAddr> <vaultUrl> <vaultAddr>
    accesses a vault on the remote vault server identified by the given contract
    Use the option --file to read a specific vault file.

  deleteVault [options] <contractAddr> <vaultUrl> <vaultAddr>
    deletes a vault on the remote vault server identified by the given contract

```

## Examples

See the following two usage examples:

  - The simpler [Example 1 - Basic Data Share](Example-Basic.md) stores 'Hello World' in a vault accessible by one requester for one day.  The example will take you through the process of deploying a Smart Data Access Contract, creating a vault, writing to the vault, accepting a smart data access request, reading the data as the requester and later deleting the vault.  

  - The more complex [Example 2 - KYC](Example-KYC.md) demonstrates the data life-cycle for a customer opening, holding and closing an account with an online trading platform.  In the example, a third-party verifier performs the Know Your Customer checks on the customer's data and the financial regulator audits the KYC process.  The customer, organisation and verifier each read and write data to the vault, while the Smart Data Access Contract controls the read, write and append file permissions at each stage of the data life-cycle.

## Copyright

Datona (c) 2020 Datona Labs

Released under the [MIT license](LICENSE)

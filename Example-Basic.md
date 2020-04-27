# Basic SDA Example

*Before following this example, make sure you have followed the instructions in [Using Datona for the First Time](README.md#Using-Datona-for-the-First-Time)*

## Overview

This example follows the following scenario:

**As a Data Owner, receive and accept a Smart Data Access Request:**

1\. Download a Smart Data Access Request from Datona Labs;

2\. Deploy the requested [Duration_SDAC](#Duration_SDAC-Solidity-Code) smart contract to the kovan testnet;

3\. Create a new data vault on the datonavault.com cloud vault server;

4\. Write the data to the vault;

5\. Inform Datona Labs that you've accepted the request;


**Explore vault permissions:**

6\. As the Requester, retrieve the data from the vault;

7\. As a different user, try to retrieve the data from the vault;

8\. As the Owner, update the data in the vault;

9\. As the Requester, retrieve the updated data from the vault;

10\. As any user, get information about the Smart Data Access Contract;


**Terminate the contract and explore permissions:**

11\. As a different user, try to terminate the Smart Data Access Contract

12\. As the Requester, retrieve the data from the vault;

13\. As the Owner, terminate the Smart Data Access Contract

14\. As the Requester, try to retrieve the data from the vault;

15\. As the Owner, try to retrieve the data from the vault;

16\. As a different user, try to delete the vault.

17\. As the Owner, delete the vault.


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
{"txn":{"txnType":"SmartDataAccessRequest","version":"0.0.2","contract":{"hash":"bfb97919a13e1ac1eb3cdf65e7b1c359a37f5e1d92fdddb31dadd464fda2802d"},"api":{"url":{"scheme":"file","host":"77.68.75.133","port":8126},"acceptTransaction":{},"rejectTransaction":{}}},"signature":"7c51666e2f7ba616f3a198745f52755b1c64728cee5b9d0ec135ef1465f682a916dcbd6bbc00b74f7c407ef203960acf875336e0d2cd6fafa4b303bb14461e1e00"}
```

or:

Download from the datonavault.com server at 77.68.75.133:

```
$ datona getRequest http://77.68.75.133:8125/0.0.2/durationRequest --raw >request
```

The ``request`` file will be used later.

The contract hash found in the request identifies the Smart Data Access Contract to be deployed (hash of its runtime bytecode). The contract is the terms and conditions that the Requester wants the Owner to accept and under which the Owner's data will be shared. In this case it is the Duration_SDAC smart contract. (The contract source code [can be found below](#duration_sdac-solidity-code)).

Let's store the contract hash for later:

```
$ contractHash=bfb97919a13e1ac1eb3cdf65e7b1c359a37f5e1d92fdddb31dadd464fda2802d
```

### 2. Deploy the requested Duration_SDAC smart contract to the kovan testnet

First we need the Duration_SDAC abi and bytecode. This can be found in datona-cli's ``contracts`` directory or can be downloaded from datonavault.com at 77.68.75.133.  Either way, let's create a variable pointing to it to make it easier later.  E.g.

```
$ contractCode=/usr/local/lib/node_modules/datona-cli/contracts/$contractHash
```
or
```
$ curl http://77.68.75.133:8125/0.0.2/contract/$contractHash > duration_sdac

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
$ vaultUrl=file://77.68.75.133:8127
$ vaultServerId=0x288b32F2653C1d72043d240A7F938a114Ab69584
```

Now create the vault.

```
$ datona createVault $contract $vaultUrl $vaultServerId --key owner
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

Behind the scenes the vault server received the create request, checked that the contract is on the blockchain and is owned by the transaction signatory then created a new empty vault.  The *VaultResponse* transaction returned was displayed as the output from the ``datona createVault`` command.

### 4. Write the data to the vault

Now that the vault has been created, the Owner must store the data.  Being a basic example, we will just store the string 'Hello World' in the root vault.  For a more complex file-based example see [Example 2 - KYC](Example-KYC.md).
```
$ datona writeVault $contract $vaultUrl $vaultServerId "Hello World" --key owner
{
  txn: {
    txnType: 'VaultResponse',
    responseType: 'success',
    data: {
      message: 'successfully wrote contract/file 0x073C8e6121eF67096c7925f7f9b2C66e3d240a74/0x0000000000000000000000000000000000000000',
      data: ''
    }
  },
  signatory: '0x288b32f2653c1d72043d240a7f938a114ab69584'
}
```

### 5. Inform Datona Labs that you've accepted the request

Now that the contract has been deployed and the vault created, the Owner needs to inform the Requester of the contract address and where the data is held by sending a Smart Data Access Response.

```
$ datona acceptRequest request $contract $vaultUrl $vaultServerId --key owner
{
  txn: { txnType: 'GeneralResponse', responseType: 'success' },
  signatory: '0x41a60f71063cd7c9e5247d3e7d551f91f94b5c3b'
}
```

The request contains the url of the Requester's server so datona-lib knows where to send the response.

Behind the scenes the Requester's server received the Smart Data Access Response, checked that the correct contract was deployed on the blockchain (retrieved it's runtime bytecode from the blockchain and compared it's hash to the one in the original Smart Data Access Request) and checked that the transaction signatory was the owner of the contract.  It then recorded the contract address and vault address & url as a new customer.

### 6. As the Requester, retrieve the data from the vault

```
$ datona readVault $contract $vaultUrl $vaultServerId --key requester
Hello World
```

Behind the scenes datona-lib sent a *VaultRequest* transaction to the vault server signed by the Requester's private key.  The vault server authenticated the signature in the VaultRequest and called the ``isPermitted`` method of the contract with the signatory recovered from the signature. This returned ``true`` so the vault server sent a *success VaultResponse* back with a copy of the data from the vault.

### 7. As a different user, try to retrieve the data from the vault

```
$ datona readVault $contract $vaultUrl $vaultServerId --key otherUser
PermissionError - permission denied
```

The call to ``isPermitted`` for this user This returned ``false`` so the vault server sent an  *error VaultResponse* back containing a PermissionError.

### 8. As the Owner, update the data in the vault;

```
$ datona writeVault $contract $vaultUrl $vaultServerId "Hi World" --key owner
{
  txn: {
    txnType: 'VaultResponse',
    responseType: 'success',
    data: {
      message: 'successfully wrote contract/file 0x073C8e6121eF67096c7925f7f9b2C66e3d240a74/0x0000000000000000000000000000000000000000',
      data: ''
    }
  },
  signatory: '0x288b32f2653c1d72043d240a7f938a114ab69584'
}
```

At this time the Owner is free to update the data in the vault at any time.  In future, update permissions will be controlled by the smart contract too.

### 9. As the Requester, retrieve the updated data from the vault

```
$ datona readVault $contract $vaultUrl $vaultServerId --key requester
Hi World
```

### 10. As any user, get information about the Smart Data Access Contract;

The smart contract developer controls who can access what methods of the Smart Data Access Contract.  In the case of the Duration_SDAC, all the ``view`` methods are unrestricted.

```
$ datona callContract $contractCode $contract getPermissions $requester 0x0000000000000000000000000000000000000000
0x04

$ datona callContract $contractCode $contract hasExpired
false

$ datona callContract $contractCode $contract getOwner
0xc16a409a39ede3f38e212900f8d3afe6aa6a8929
```

### 11. As a different user, try to terminate the Smart Data Access Contract

```
$ datona terminateContract $contractCode $contract --key otherUser
BlockchainError - Transaction has been reverted by the EVM:
...
```

### 12. As the Requester, retrieve the data from the vault

```
$ datona readVault $contract $vaultUrl $vaultServerId --key requester
Hi World
```

### 13. As the Owner, terminate the Smart Data Access Contract

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

### 14. As the Requester, try to retrieve the data from the vault

```
$ datona readVault $contract $vaultUrl $vaultServerId --key requester
PermissionError - permission denied
```

### 15. As the Owner, try to retrieve the data from the vault

```
$ datona readVault $contract $vaultUrl $vaultServerId --key owner
PermissionError - permission denied
```

### 16. As a different user, try to delete the vault

```
$ datona deleteVault $contract $vaultUrl $vaultServerId --key otherUser
ContractOwnerError - owner does not match
```

### 17. As the Owner, delete the vault

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

The source code is compiled using v0.6.3 of the Byzantium compiler.  If making your own S-DAC, be sure to use that compiler and create a JSON file in the same format as those in the /usr/local/lib/node_modules/datona-cli/contracts/ folder.

```
pragma solidity ^0.6.3;

import "SDAC.sol";

contract Duration_SDAC is SDAC {

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

    function getPermissions( address requester, address file ) public view override returns (byte) {
        if ( file == address(0) && !hasExpired() ) {
            if (requester == owner) return NO_PERMISSIONS | READ_BIT | WRITE_BIT | APPEND_BIT;
            if (requester == permittedRequester) return NO_PERMISSIONS | READ_BIT;
        }
        return NO_PERMISSIONS;
    }

    function isPermitted( address requester ) public view returns (bool) {
        return ( getPermissions(requester, address(0)) & READ_BIT ) > 0;
    }

    function hasExpired() public view override returns (bool) {
        return terminated ||
               (block.timestamp - contractStart) >= (contractDuration * 1 days);
    }

    function terminate() public override onlyOwnerOrRequester {
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

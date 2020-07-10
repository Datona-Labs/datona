#!/usr/bin/env node
/*
 * Datona cli main file.  Provides
 *
 * use --help for usage information
 *
 */

// Modules
const CONFIG = require('../config.json');
const Commander = require('commander');
const os = require('os');
const datona = require('datona-lib');
const assert = datona.assertions;
const errors = datona.errors;
const axios = require('axios');
const fs = require('fs');
const URL = require('url');

// Constants
const program = new Commander.Command("datona");
const defaultKeyName = "defaultkey";
const keyPath = os.homedir()+"/.datona";

// Configure datona-lib

datona.blockchain.setProvider(CONFIG.blockchainURL);


// MAIN

program
	.version('0.1.1-alpha')
	.usage('<command> [options] [args]   # Try datona <command> --help');


// GENERATEKEY Command
program
	.command('generateKey [name]')
	.description('generates a new private key and stores it in the ~/.datona directory with the optional name. Outputs the key\'s public address.')
	.option('--force', 'overwrites the given key if it exists. Cannot be undone')
	.action(function(name, options){
		generateKey(name, options.force);
	});


// SAVEKEY Command
program
	.command('saveKey <privateKey> [name]')
	.description('stores the given private key in the ~/.datona directory with the optional name.')
	.option('--force', 'overwrites the given key if it exists. Cannot be undone')
	.action(function(privateKey, name, options){
		generateKey(name, options.force, privateKey);
	});


// GETADDRESS Command
program
	.command('getAddress [name]')
	.description('displays the public address of the key with the given name. If no name is given the default key is used.')
	.action(function(name, options){
    const key = loadKey(name);
    console.log(key.address);
	});


// GETREQUEST Command
program
	.command('getRequest <url>')
	.description('gets a request from the given http restful api')
	.option('--raw', 'don\'t decode, just output the raw request')
	.action(function(url, options){
		axios.get(url)
		  .then(response => {
					const rawRequest = JSON.stringify(response.data);
					if (!options.raw) {
						const key = loadKey(options.key);
						const request = new datona.comms.SmartDataAccessRequest(rawRequest, key);
						console.log("request: "+rawRequest);
						console.log("signatory: "+request.remoteAddress);
					}
					else console.log(rawRequest);
				})
				.catch( error => { console.error(error.toString()) });
	});


// ACCEPTREQUEST Command
program
	.command('acceptRequest <file> <contractAddr> <vaultUrl> <vaultAddr>')
	.description('accepts the given request by sending a Smart Data Access Response to the requester.')
	.option('--key <key>', 'use the given key name instead of the default')
	.action(function(file, contractAddress, vaultUrlStr, vaultAddress, options){
		if( !fs.existsSync(file) ) throw new errors.DatonaError("Request file does not exist");
		assert.isAddress(contractAddress, "Invalid contract address");
		assert.isAddress(vaultAddress, "Invalid vault address");
		const signedRequestStr = fs.readFileSync(file).toString();
    	const vaultUrl = toUrl(vaultUrlStr);
		const key = loadKey(options.key);
    	const request = new datona.comms.SmartDataAccessRequest(signedRequestStr, key);
		request.accept(contractAddress, vaultAddress, vaultUrl)
		  .then(console.log)
			.catch( error => { console.error(error.toString()) });
	});


// DEPLOYCONTRACT Command
program
	.command('deployContract <file> <args...>')
	.description('deploys a contract to the blockchain with the given constructor args')
	.option('--key <key>', 'use the given key name instead of the default')
	.action(function(file, args, options){
		const contractSourceCode = loadContract(file);
		const key = loadKey(options.key);
		const sdac = new datona.blockchain.Contract(contractSourceCode.abi);
		sdac.deploy(key, contractSourceCode.bytecode, args)
			.then(console.log)
			.catch( error => { console.error(error.toString()) });
	});


// CALLCONTRACT Command
program
	.command('callContract <file> <contractAddr> <method> [args...]')
	.description('calls a specific view or pure method of a contract')
	.action(function(file, contractAddress, method, args, options){
		const contractSourceCode = loadContract(file);
		assert.isAddress(contractAddress, "Invalid contract address");
		const sdac = new datona.blockchain.Contract(contractSourceCode.abi, contractAddress);
		sdac.call(method, args)
			.then(console.log)
			.catch( error => { console.error(error.toString()) });
	});


// TRANSACTCONTRACT Command
program
	.command('transactContract <file> <contractAddr> <function> [args...]')
	.description('calls a specific state-modifying method of a contract')
	.option('--key <key>', 'use the given key name instead of the default')
	.action(function(file, contractAddress, functionName, args, options){
		const contractSourceCode = loadContract(file);
		assert.isAddress(contractAddress, "Invalid contract address");
		const key = loadKey(options.key);
		const sdac = new datona.blockchain.Contract(contractSourceCode.abi, contractAddress);
		sdac.transact(key, functionName, args)
			.then(console.log)
			.catch( error => { console.error(error.toString()) });
	});


// TERMINATECONTRACT Command
program
	.command('terminateContract <file> <contractAddr>')
	.description('terminates the contract at the given address ')
	.option('--key <key>', 'use the given key name instead of the default')
	.action(function(file, contractAddress, options){
		const contractSourceCode = loadContract(file);
		assert.isAddress(contractAddress, "Invalid contract address");
		const key = loadKey(options.key);
		const sdac = new datona.blockchain.Contract(contractSourceCode.abi, contractAddress);
		sdac.terminate(key)
			.then(console.log)
			.catch( error => { console.error(error.toString()) });
	});


// CREATEVAULT Command
program
	.command('createVault <contractAddr> <vaultUrl> <vaultAddr>')
	.description('creates a vault on the remote vault server controlled by the given contract')
	.option('--key <key>', 'use the given key name instead of the default')
	.action(function(contractAddress, vaultUrlStr, remoteAddress, options){
		vaultCommand("create", vaultUrlStr, contractAddress, remoteAddress, undefined, options);
	});


// WRITEVAULT Command
program
	.command('writeVault <contractAddr> <vaultUrl> <vaultAddr> <data>')
	.description('writes data to a vault on the remote vault server identified by the given contract')
	.option('--key <key>', 'use the given key name instead of the default')
	.option('--file <file>', 'write to this specific file within the vault')
	.action(function(contractAddress, vaultUrlStr, remoteAddress, data, options){
		vaultCommand("write", vaultUrlStr, contractAddress, remoteAddress, data, options);
	});


// APPENDVAULT Command
program
	.command('appendVault <contractAddr> <vaultUrl> <vaultAddr> <data>')
	.description('appends data to a vault on the remote vault server identified by the given contract')
	.option('--key <key>', 'use the given key name instead of the default')
	.option('--file <file>', 'append to this specific file or directory within the vault')
	.action(function(contractAddress, vaultUrlStr, remoteAddress, data, options){
		vaultCommand("append", vaultUrlStr, contractAddress, remoteAddress, data, options);
	});


// READVAULT Command
program
	.command('readVault <contractAddr> <vaultUrl> <vaultAddr>')
	.description('accesses a vault on the remote vault server identified by the given contract')
	.option('--key <key>', 'use the given key name instead of the default')
	.option('--file <file>', 'read from this specific file or directory within the vault')
	.action(function(contractAddress, vaultUrlStr, remoteAddress, options){
		vaultCommand("read", vaultUrlStr, contractAddress, remoteAddress, undefined, options);
	});


// DELETEVAULT Command
program
	.command('deleteVault <contractAddr> <vaultUrl> <vaultAddr>')
	.description('deletes a vault on the remote vault server identified by the given contract')
	.option('--key <key>', 'use the given key name instead of the default')
	.action(function(contractAddress, vaultUrlStr, remoteAddress, options){
		vaultCommand("delete", vaultUrlStr, contractAddress, remoteAddress, undefined, options);
	});


// CATCH ALL
program
  .on('command:*', function () {
  console.error('Invalid command.\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});


// PROCESS & RUN COMMAND
try{
  program.parse(process.argv);
}
catch(error) {
  const exception = error instanceof errors.DatonaError ? error : new errors.DatonaError(error.message);
  console.error(exception.toString());
}
if( process.argv.length < 3 ){ program.outputHelp(); }


//-----------------------------------------------------------------------------

function generateKey(keyName = defaultKeyName, overwrite = false, useKey) {
  assert.isString(keyName, "Invalid key name - expecting String.\nUsage: generateKey [keyName]");
	if (useKey !== undefined) assert.isPrivateKey(useKey, "privateKey");
  const key = useKey ? new datona.crypto.Key(useKey) : datona.crypto.generateKey();

  try {
    if (!fs.existsSync(keyPath)) fs.mkdirSync(keyPath, 0700);
  }
  catch (error) {
    throw new errors.FileSystemError(error, "Cannot create wallet directory");
  }

  if( !overwrite && fs.existsSync(keyPath+"/"+keyName) ) throw new errors.PermissionError("Key already exists. Use --force to forcibly overwrite it");

  fs.writeFile(keyPath+"/"+keyName, key.privateKey.toString('hex'), function (error) {
    if (error) throw errors.FileSystemError(error, "Cannot save new key");
  });
  console.log(key.address);
}


//-----------------------------------------------------------------------------

function vaultCommand(command, vaultUrlStr, contractAddress, remoteAddress, data, options) {
	const vaultUrl = toUrl(vaultUrlStr);
	assert.isAddress(contractAddress, "Invalid contract address");
	assert.isAddress(remoteAddress, "Invalid remote address");
	const key = loadKey(options.key);
	const remoteVault = new datona.vault.RemoteVault(vaultUrl, contractAddress, key, remoteAddress);
	function callRemoteVault() {
		if (data === undefined) return remoteVault[command](options.file);
		else return remoteVault[command](data, options.file);
	}
	callRemoteVault()
		.then(console.log)
		.catch( error => { console.error(error.toString()) });
}


//-----------------------------------------------------------------------------

function loadKey(keyName) {
  if (keyName === undefined) keyName = process.env.DATONA_KEY || defaultKeyName;
  if( !fs.existsSync(keyPath+"/"+keyName) ) throw new errors.DatonaError("Key does not exist");
  try {
		const privateKey = fs.readFileSync(keyPath+"/"+keyName).toString();
    return new datona.crypto.Key(privateKey);
  }
  catch(error){
    throw new errors.FileSystemError("Cannot read "+keyPath+"/"+keyName+". "+error.message);
  }
}


//-----------------------------------------------------------------------------

function loadContract(file) {
	if( !fs.existsSync(file) ) throw new errors.DatonaError("Contract file does not exist");
	var contractSourceCode;
	try{
		 return JSON.parse(fs.readFileSync(file));
	}
	catch (error) {
		console.error("File must be a JSON object of the form: { abi, bytecode, runtimeBytecode }.  See datona-lib/contracts for examples.");
		throw new errors.DatonaError(error.message);
	}
}


//-----------------------------------------------------------------------------

function toUrl(str) {
  var parts = str.split(':');
  if (parts.length !== 3) { throw new errors.DatonaError("Invalid url: "+str+".  Expecting the form scheme://host:port"); }
	try{
		return {
	    scheme: parts[0],
	    host: parts[1].replace(/^\/*/,''),
	    port: parseInt(parts[2])
	  };
	}
	catch (error) {
		throw new errors.DatonaError("Invalid url.  Expecting the form scheme://host:port");
	}
}

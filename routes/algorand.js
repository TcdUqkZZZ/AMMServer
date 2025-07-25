var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, './algorand/config.json')))
let managerInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, './algorand/.secret.json')))
const {whitelist, mint} = require('./algorand/lib.js')
const algosdk = require('algosdk')
const {algodError} = require('./algorand/errors.js')
let mode;
let appId;
let appAccount;
let dbURI;
let managerAddr = managerInfo.address;
let managerMnemonic = managerInfo.mnemonic;
let algodClient
let algodServer
let algodPort
let algodToken
let dbName;


mode = process.argv.slice(2)[0];

if (mode == 'testnet'){
try {
    appId = config.testnet.appId;
    appAccount = config.testnet.appAccount;
    dbURI = config.testnet.dbURI;
    dbName = config.testnet.dbName;
    algodServer = config.testnet.algodServer;
    algodPort = config.testnet.algodPort;
    algodToken = config.testnet.algodToken;
} catch(e) {

}}
else if (mode == 'mainnet'){
try {  appId = config.mainnet.appId;
    appAccount = config.mainnet.appAccount;
    dbURI = config.mainnet.dbURI;
    dbName = config.testnet.dbName;
    algodServer = config.mainnet.algodServer;
    algodPort = config.mainnet.algodPort;
    algodToken = config.mainnet.algodToken;

} catch(e) {
}
}

try {
    algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort)
    console.log(`algodClient initialized with token ${algodToken} on server ${algodServer}`)
} catch (e) {
throw new algodError(e.message);
}

router.get('/appInfo', (req, res) => {
    res.json({
        appId: appId,
        appAccount: appAccount
    })
})

router.get('/Whitelist', async (req, res) => {
    user = req.params.address
    let {whitelistOutcome, whitelistTier, whitelistTxId} =  await whitelist(managerAddr, managerMnemonic, user,dbURI, dbName, appId, algodClient)
    res.json({
        success: whitelistOutcome,
        tier: whitelistTier,
        txId: whitelistTxId
    })
})

router.post('/requestMint', async (req, res) => {
    paymentTx = req.body
    let {result, txId} = await mint(managerAddr, managerMnemonic, paymentTx, appId, dbURI,dbName, algodClient)
    res.json({
        result: result,
        assetURI: txId
    })
    
})


module.exports = router;

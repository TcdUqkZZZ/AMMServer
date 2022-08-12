var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, './algorand/config.json')))
const {whitelist, mint} = require('./algorand/lib.js')
let mode;
let appId;
let appAccount;
let dbURI;
let manager
let algodClient

mode = process.argv.slice(2)[0];

if (mode == 'testnet'){
try {
    appId = config.testnet.appId;
    appAccount = config.testnet.appAccount;
    dbURI = config.testnet.dbURI;
} catch(e) {

}}
else if (mode == 'mainnet'){
try {  appId = config.mainnet.appId;
    appAccount = config.mainnet.appAccount;
    dbURI = config.mainnet.dbURI;
} catch(e) {}
}

router.get('/appInfo', (req, res) => {
    res.json({
        appId: appId,
        appAccount: appAccount
    })
})

router.get('/Whitelist', async (req, res) => {
    user = req.params.address
    let {whitelistOutcome, whitelistTier, whitelistTxId} =  await whitelist(deployer, manager, user,dbURI, appId)
    res.json({
        success: whitelistOutcome,
        tier: whitelistTier,
        txId: whitelistTxId
    })
})

router.post('/requestMint', async (req, res) => {
    paymentTx = req.body
    let {result, txId} = await mint(deployer, manager, paymentTx, appId, dbURI)
    res.json({
        result: result,
        assetURI: txId
    })
    
})


module.exports = router;

const {MongoClient} = require("mongodb") 
const {algorandError, dbError} = require('./errors.js')
const fs = require('fs');
const path = require("path");
const algosdk = require('algosdk');
const secret = fs.readFileSync(path.resolve(__dirname, "./.secret"), 'utf8')


 exports.whitelist = async function (manager, addrToWhitelist, dbURI, dbName, appId, algodClient){
  let params = await algodClient.getTransactionParams().do();
  let mongoClient;
  let user;
  let db;
  let sk = algosdk.mnemonicToSecretKey(secret);
  try {
    mongoClient = new MongoClient(dbURI);
    await mongoClient.connect();
    db = mongoClient.db(dbName)
    user = db.collection('Whitelisted').find({address: addrToWhitelist})
  } catch(e){
    throw new dbError(e.message);
  }
 
  if (user.tier >= 0 && user.registered == false){
    try{

    let txn = algosdk.makeApplicationNoOpTxnFromObject(
      {
        from: manager,
        suggestedParams: params,
        appIndex: appId,
        accounts: [addrToWhitelist],
        appArgs: [algosdk.encodeObj("set_whitelist"), algosdk.encodeObj(parseInt(tier))]
      }
    )

    let signedTxn = txn.signTxn(sk);

    await algodClient.sendRawTransaction(signedTxn).do();

    await algosdk.waitForConfirmation(algodClient, txn.txID().toString(), 4);
  
      db.collection('Whitelisted').updateOne({address: addrToWhitelist}, {$set: {registered: true}})
    } catch(e){
      throw new algorandError(e.message)
    }
    await mongoClient.close();
    return (true, user.tier, txn.txID())
  }
  else if (user.registered == true) {
    await mongoClient.close();
    return (true, user.tier, "already registered")
  }
  else {
    await mongoClient.close();
    return (false, 0, "unregistered")
  }
}

exports.mint =  async function (manager,buyerAddr,paymentTx,appId, dbURI, dbName, algodClient){
  let params = await algodClient.getTransactionParams().do();
  let sk = algosdk.mnemonicToSecretKey(secret);
  let mongoClient;
  let chosenAsset
  let db;
  try {
    mongoClient = new MongoClient(dbURI);
    await mongoClient.connect();
    db = mongoClient.db(dbName)
    const assetList = db.collection('assets')
    const availableAssets = assetList.find({minted: false}).toArray()
    chosenAsset = availableAssets[Math.floor(Math.random() * availableAssets.length())]
  } catch(e){
    throw new dbError(e.message)
  }

  if (availableAssets.length > 0) {
    let stringifiedMetadata = JSON.stringify(chosenAsset.metadata)
    let txn = algosdk.makeApplicationNoOpTxnFromObject(
      {
        from: manager,
        suggestedParams: params,
        appIndex: appId,
        appArgs: [algosdk.encodeObj("buy"),
         algosdk.encodeObj(`${chosenAsset.url}`),
         algosdk.encodeObj(`${stringifiedMetadata}`)]
      }
    )
    signedTxn = txn.signTxn(sk)
    let txGroup = [signedTxn, paymentTx]
    try{
      const {txId} = await algodClient.sendRawTransaction(txGroup).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      db.collection('assets').updateOne({id: chosenAsset.id}, { $set: {minted: true}});
      } catch(e){
        throw new algorandError(e.message);
    }
    await db.close()
    let uri = chosenAsset.url
    let accountInfo = await algodClient.accountApplicationInformation(buyerAddr, appId).do();
    let assetId = await accountInfo.query('unclaimed').do();
    return (assetId, uri, txId)
  } else {
    await db.close
    return (0, "", "")
  }

}





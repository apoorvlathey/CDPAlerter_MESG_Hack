const web3 = require("web3");
const axios = require("axios");

const mongoose = require("mongoose");
const users = require("./models/users");

if (process.env.INFURA_KEY == null) {
  require("dotenv").config();
}

const BOT_TOKEN = process.env.BOT_TOKEN;

const dbUrl = process.env.DATABASE_URL;
mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("DB Connected.");
  })
  .catch((err) => {
    console.log("Error Connecting to DB!");
  });

//Infura HttpProvider Endpoint
const web3js = new web3(
  new web3.providers.HttpProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
  )
);

//get vatABI and cdpABI from Etherscan using addresses
const vatABI = require("./vatABI.json");
const cdpABI = require("./cdpMgrABI.json");

const VAT_ADDR = "0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b";
const CDP_MGR_ADDR = "0x5ef30b9986345249bc32d8928b7ee64de9435e39";

let vat = new web3js.eth.Contract(vatABI, VAT_ADDR);
let cdpMgr = new web3js.eth.Contract(cdpABI, CDP_MGR_ADDR);

// let vault = 1588;

//CHANGE THIS: get ilk/collateral string from somewhere like ENV
let ilk = "ETH-A";

//collateral type formatted into hex bytes32
ilk = web3.utils.fromAscii(ilk); // ETH-A: 0x4554482d41000000000000000000000000000000000000000000000000000000

async function getCDP(chatid, vault, threshold, lastMsgSentTime, _id) {
  var now = Math.round(new Date().getTime() / 1000);
  if (now - lastMsgSentTime >= 60 * 60) {
    //lookup the vault address by its numeric id ( from Oasis dashboard)
    let urnADDR = await cdpMgr.methods.urns(vault).call();
    //ask vat for computation elements using urn and ilk
    //first, get the rate and spot from vat for the collateral type
    let ilkR = await vat.methods.ilks(ilk).call();
    let urnsR = await vat.methods.urns(ilk, urnADDR).call();
    let {
      rate, //stablecoin debt multiplier (accumulated stability fees)
      spot, //collateral price with safety margin
    } = ilkR;
    let {
      ink, //collateral
      art, //debt
    } = urnsR;
    //spot price is reduced by the 150% margin requirement. Add it back.
    let colPrice = spot * 150;
    //compute total staked collateral in native price
    let totalCol = ink * colPrice;
    //Compute the total debt including stability fee adjustments
    let totalDebt = art * rate;
    //adjust collateral 2 dec places and compute debt ratio
    let cdp = (totalCol * 100) / totalDebt;
    //as a percentage
    cdp = (cdp.toString() - 0) / 100;
    //do something with CDP
    //console.log(cdp)

    if (cdp <= threshold) {
      var uri = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${chatid}&text=🚨🚨🚨 CDP Ratio is in Danger Zone! 🚨🚨🚨\nAct Now before it's too late!\nCDP Ratio for Vault No. ${vault} is ${cdp.toFixed(
        2
      )}.`;
      axios.get(encodeURI(uri)).then((resp) => {
        //console.log(resp.data);
        lastMsgSentTime = now;
        console.log("Msg sent");

        users.findByIdAndUpdate(_id, { lastMsgSentTime: now }, { new: true })
          .then((user) => {
            console.log({
              confirmation: "success",
              data: user,
            });
          })
          .catch((err) => {
            console.log({
              confirmation: "fail",
              message: err.message,
            });
          });
      });
    }
  }
}

function getCDPAllusers() {
  users.find({}, (err, usersList) => {
    usersList.map((u) => {
      getCDP(u.chatid, u.vault, u.threshold, u.lastMsgSentTime, u._id);
    });
  });
}

setInterval(() => getCDPAllusers(), 3000);

const web3 = require("web3");
require('dotenv').config();

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

let vault = 8022;

//CHANGE THIS: get ilk/collateral string from somewhere like ENV
let ilk = "ETH-A";

//collateral type formatted into hex bytes32
ilk = web3.utils.fromAscii(ilk); // ETH-A: 0x4554482d41000000000000000000000000000000000000000000000000000000

async function getCDP(vault) {
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
  console.log(cdp);
}

getCDP(vault);

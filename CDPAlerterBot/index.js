const Telegraf = require("telegraf"); // import telegram lib
const express = require("express")

if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const URL = process.env.URL; // get the server config var URL
const PORT = process.env.PORT || 2000;
const CHAT_ID = process.env.CHAT_ID;

const bot = new Telegraf(BOT_TOKEN); // get the token from envirenment variable

// Config the webhook for server
bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
//bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT);

var app = express()
app.get('/CDPAlerter', function (req, res) {
  res.send('Bot is Online');
})
app.get('/CDPAlerter/send/:chatid/:msg', (req, res) => {
  const msg= req.params.msg
  const chatid = req.params.chatid
  bot.telegram.sendMessage(chatid, msg)
  res.send("Message Sent: " + msg);
})

if (typeof(PhusionPassenger) !== 'undefined') {
  app.listen('passenger');
} else {
  app.listen(80);
}

// bot.telegram.sendMessage(CHAT_ID, `Hello I am working ${URL}/bot${BOT_TOKEN}`)

console.log("Bot Started");
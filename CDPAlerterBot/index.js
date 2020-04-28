const Telegraf = require("telegraf"); // import telegram lib
const Markup = require("telegraf/markup");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");
const { enter, leave } = Stage;
const axios = require("axios");
const mongoose = require("mongoose");
const users = require('./models/users')

if (process.env.BOT_TOKEN == null) {
  require("dotenv").config();
}

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const URL = process.env.URL; // get the server config var URL
const CHAT_ID = process.env.CHAT_ID;
const dbUrl = process.env.DATABASE_URL;

//delete previous instance
//axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebHook`);

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("DB Connected.");
  })
  .catch((err) => {
    console.log("Error Connecting to DB!");
  });

const bot = new Telegraf(BOT_TOKEN); // get the token from envirenment variable

// Config the webhook for server
//bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
//bot.startWebhook(`${URL}/bot${BOT_TOKEN}`, null, 5000);

// display Welcome text when we start bot
bot.start((ctx) =>
  bot.telegram.sendMessage(
    ctx.chat.id,
    `Welcome to CDPAlerter!\n
    ${ctx.from.first_name}, please Setup Alerts for your CDP Vault:\n
    /setupalert`,
    Markup.inlineKeyboard([
      Markup.callbackButton("Setup Alert", "SETUP_ALERT"),
    ]).extra()
  )
);

const initializeVaultData = new WizardScene(
  "initialize",
  (ctx) => {
    bot.telegram.sendMessage(
      ctx.chat.id,
      "Let's Setup Alerts for your Vault!\nEnter your Vault No. to track."
    );
    return ctx.wizard.next();
  },
  (ctx) => {
    /*
     * ctx.wizard.state is the state management object which is persistent
     * throughout the wizard
     * we pass to it the previous user reply (supposed to be the source Currency )
     * which is retrieved through `ctx.message.text`
     */
    ctx.wizard.state.vaultNo = ctx.message.text;
    bot.telegram.sendMessage(
      ctx.chat.id,
      `Got it, enter the CDP Ratio to receive Alert for.\n[Eg: 200 for 200% limit]`
    );
    // Go to the following scene
    return ctx.wizard.next();
  },
  (ctx) => {
    const cdpLimit = (ctx.wizard.state.cdpLimit = ctx.message.text);
    const vaultNo = ctx.wizard.state.vaultNo;

    console.log("CDP limit:", cdpLimit, "VaultNo:", vaultNo);

    users.create({
      chatid: ctx.chat.id,
      vault: vaultNo,
      threshold: cdpLimit
    })

    bot.telegram.sendMessage(
      ctx.chat.id,
      `Done! You would get an alert for your Vault No. ${vaultNo} when the CDP goes below ${cdpLimit}%.`
    );
    return ctx.scene.leave();
  }
);
// Scene registration
const stage = new Stage([initializeVaultData], { ttl: 300 });
bot.use(session());
bot.use(stage.middleware());

bot.command("setupalert", enter("initialize"));
bot.action("SETUP_ALERT", enter("initialize"));
bot.startPolling(); // start

// bot.telegram.sendMessage(CHAT_ID, `Hello I am working`)

console.log("Bot Started");

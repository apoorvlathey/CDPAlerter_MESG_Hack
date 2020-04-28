const Application = require("@mesg/application");
const mesg = new Application();

async function main() {
  mesg
    .listenEvent({
      filter: {
        instanceHash: await mesg.resolve("CDPWeb3Alerter"),
        key: "alert",
      },
    })
    .on("data", async (event) => {
      const alert = mesg.decodeData(event.data);

      console.log("... sending Telegram Message")
      try {
        const result = await mesg.executeTaskAndWaitResult({
          executorHash: await mesg.resolveRunner("telegram-send-msg"),
          taskKey: "send",
          eventHash: event.hash,
          inputs: mesg.encodeData({
            chatid: alert.chatid,
            message: alert.message
          }),
        });
        if (result.error) {
          console.error("error during sending message", result.error);
          return;
        }
        console.log(
          "task send return status",
          mesg.decodeData(result.outputs).status
        );
      } catch (err) {
        console.error(err.message);
      }
    })
    .on("error", (err) => {
      console.error(err.message);
    });

  console.log("Listening for CDP Alerts...");
}

main();

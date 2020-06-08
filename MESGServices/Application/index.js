const Application = require("@liteflow/application");
const liteflow = new Application();

async function main() {
  liteflow
    .listenEvent({
      filter: {
        instanceHash: await liteflow.resolve("CDPWeb3Alerter"),
        key: "alert",
      },
    })
    .on("data", async (event) => {
      const alert = liteflow.decodeData(event.data);

      console.log("... sending Telegram Message")
      try {
        const result = await liteflow.executeTaskAndWaitResult({
          executorHash: await liteflow.resolveRunner("telegram-send-msg"),
          taskKey: "send",
          eventHash: event.hash,
          inputs: liteflow.encodeData({
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
          liteflow.decodeData(result.outputs).status
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

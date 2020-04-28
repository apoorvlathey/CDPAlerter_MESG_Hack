const axios = require("axios");

module.exports = (inputs) => {
  var uri = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${inputs.chatid}&text=${inputs.message}`;
	axios.get(encodeURI(uri))
		.then((resp) => {
      console.log("Msg sent");
			return 1;
  	})
		.catch((err) => {
			return 0;
		})
}

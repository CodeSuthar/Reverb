const Reverb = require("./structures/client.js");

const client = new Reverb();

client.build();
client.deploy();

module.exports = client;
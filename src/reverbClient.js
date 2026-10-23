const Reverb = require("./structures/client.js");

const client = new Reverb();

(async () => {
    try {
        await client.build();
        await client.deploy();
    } catch (err) {
        client.logger?.error("Failed to initialize and deploy Reverb client:", err);
    }
})();

module.exports = client;

const { ActivityType } = require("discord.js");

module.exports = {
    name: "raw",
    run: async (client, packet) => {
        client.musicManager.packetUpdate(packet);
    }
}
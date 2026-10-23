const { queueViewUpdate } = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerChangedVolume",
    run: async (client, player, oldVolume, volume) => {
        if (!player) return;

        // Automatically update setup message and track player view with new volume
        queueViewUpdate(client, player);
    }
};

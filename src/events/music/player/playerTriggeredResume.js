const { updateVoiceStatus, queueViewUpdate } = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerTriggeredResume",
    run: async (client, player) => {
        if (!player) return;

        player.paused = false;

        // Immediately update voice channel status to: 🎵 • Track Title
        await updateVoiceStatus(client, player);

        // Automatically update setup message and track player view
        queueViewUpdate(client, player);
    }
};

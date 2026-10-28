const {
    updateVoiceStatus, queueViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerTriggeredPause",
    run: async (client, player) => {
        if (!player) return;

        player.paused = true;

        // Immediately update voice channel status to: ⏸️ • Track Title
        await updateVoiceStatus(client, player);

        // Automatically update setup message and track player view
        queueViewUpdate(client, player);
    }
};

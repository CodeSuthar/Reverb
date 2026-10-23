const { updateVoiceStatus, queueViewUpdate } = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerPause",
    run: async (client, player, paused) => {
        if (!player) return;

        player.paused = Boolean(paused);

        // Update voice channel status:
        // Paused: ⏸️ • Track Title
        // Resumed: 🎵 • Track Title
        await updateVoiceStatus(client, player);

        // Automatically update setup message and track player view
        queueViewUpdate(client, player);
    }
};

const {
    updateVoiceStatus, executeViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerTriggeredStop",
    run: async (client, player) => {
        if (!player) return;

        // Clear voice channel status automatically
        await updateVoiceStatus(client, player, "");

        // Delete track player message and update setup message to idle
        await executeViewUpdate(client, player, { stopped: true });
    }
};

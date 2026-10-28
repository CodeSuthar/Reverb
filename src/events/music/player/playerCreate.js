const {
    updateVoiceStatus, executeViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerCreate",
    run: async (client, player) => {
        if (!player) return;

        // Clear voice channel status on initial player creation
        await updateVoiceStatus(client, player, "");

        // Initialize setup view to idle
        await executeViewUpdate(client, player);
    }
};

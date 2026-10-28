const {
    updateVoiceStatus, executeViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerDisconnected",
    run: async (client, player) => {
        if (!player) return;

        // Clear voice channel status automatically on player disconnect
        await updateVoiceStatus(client, player, "");

        // Delete track player message and reset setup view to idle
        await executeViewUpdate(client, player, { destroyed: true });
    }
};

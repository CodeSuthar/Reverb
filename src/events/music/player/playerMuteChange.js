const { updateVoiceStatus, queueViewUpdate } = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerMuteChange",
    run: async (client, player, selfMuted, serverMuted) => {
        if (!player) return;

        if (serverMuted || selfMuted) {
            if (player.current && !player.paused) {
                await player.pause().catch(() => null);
            }
        }

        await updateVoiceStatus(client, player);
        queueViewUpdate(client, player);
    }
};

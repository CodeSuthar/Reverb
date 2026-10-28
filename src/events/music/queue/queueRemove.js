const {
    executeViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "queueRemove",
    run: async (client, player, tracks) => {
        if (!player) return;

        // Rebalance remaining queue into fair round-robin order if FairPlay mode is active
        try {
            const isFairPlay = (await player.getData?.("fairplay")) || player.get?.("fairplay");
            if (isFairPlay && typeof player.setFairPlay === "function") {
                await player.setFairPlay();
            }
        } catch (err) {
            (client.logger || console).error(`[FAIRPLAY] Error reordering queue on queueRemove:`, err);
        }

        // Automatically update the persistent setup message's queue listing
        await executeViewUpdate(client, player);
    },
};

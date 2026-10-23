const { executeViewUpdate } = require("../../../utils/musicUtils/index");

module.exports = {
    name: "queueAdd",
    run: async (client, player, tracks) => {
        if (!player) return;

        // Automatically update the persistent setup message's queue listing
        await executeViewUpdate(client, player);
    },
};

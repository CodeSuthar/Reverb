const {
    queueViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "filtersUpdate",
    run: async (client, player, filters) => {
        if (!player) return;

        // Automatically update views when filters change
        queueViewUpdate(client, player);
    }
};

const {
    queueViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playerChangedLoop",
    run: async (client, player, oldLoop, loop) => {
        if (!player) return;

        // Automatically update setup message and track player view with new loop state
        queueViewUpdate(client, player);
    }
};

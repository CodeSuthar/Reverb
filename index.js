const { ShardingManager } = require("discord.js");
const { bot } = require("./config.reverb.js");
const logger = require("./src/utils/logger");

console.log(`${logger.colors.mainBold}
                                                                                      ░░░▒▒▒▒░
░░░░░░░░░░░                                                                    ░▒▓██████▒
░▒▓████████████▓▓▒                                                   ░░▒▒▓  ░░▒░░  ░████▒
   ░████░    ░░▒███▒             ░░░▒▒▒▒▓▓▒░░                    ░▒▓██████▓██████▒  ████▒
   ░████░      ░███▒    ░▒▓████▓▓▒░░▒████▓  ░▒▓███▓▓▒░░░▒▓████▓▒░    ▒████▓░ ▒███░  ████░
    ████▓▓▓▓▓███▓▒     ▓███▒░░▒███▓░  ▓███▒    ▒██░   ▓███▒░░▒███▓░  ░████          ▓███░
    ████▓▒░▒███▓      ▓███░     ███▓   ▓███▒  ▒██░   ▓███░     ███▓   ▓██▓          ▓███▓▓▓███▓▓▒░
    ████▓   ░████░   ░██████████████░   ▒███▒▒██░   ░██████████████░  ▓██▓          ▓███▒░░ ░▒█████░
    ████▓     ▓███▓   ▓███░              ▒████▓      ▓███▒           ░▓███▓▒░       ▒███       ████▒
░▒▓███████▓▒░  ▓████░  ▒███▓▒▒▒▒▒▒░       ░███        ▒███▓▒▒▒▒▒▒▒░▒▓█▓▓▓▓▓▒▒░░     ▒███      ▒███▓
░░░░░░░░░░░░░   ▓████████▓▓▓▓▓▓▒░          ░▓░          ░▒▓▓▓▓▒░                   ░▓███▒▒▒▒▓███▓░
               ░▓███▓▒░░                                                         ░▓▓▓▓▓▓▓▒▒▒▒░░
              ░▒▒░
${logger.colors.reset}`);

logger.divider("═", 96);
logger.client("Starting Reverb Sharding Manager...");

const manager = new ShardingManager('./src/reverbClient.js', {
    totalShards: "auto",
    shardList: "auto",
    token: bot.token
});

manager.on("shardCreate", async (shard) => {
    logger.shard(`Shard #${shard.id} created`);
});

manager.spawn({ timeout: -1 });

module.exports = manager;

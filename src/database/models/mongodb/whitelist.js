const { Schema, model, models } = require("mongoose");

const whitelistSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
        },
        mode: {
            type: Boolean,
            default: false,
        },
        channels: {
            type: [String],
            default: [],
        },
        roles: {
            type: [String],
            default: [],
        },
        users: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = models.Whitelist || model("Whitelist", whitelistSchema);

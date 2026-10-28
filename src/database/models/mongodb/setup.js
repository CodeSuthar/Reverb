const {
    Schema, model, models
} = require("mongoose");

const setupSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
        },
        parentChannelId: {
            type: String,
            default: null,
        },
        textChannelId: {
            type: String,
            required: true,
        },
        voiceChannelId: {
            type: String,
            default: null,
        },
        messageId: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = models.Setup || model("Setup", setupSchema);

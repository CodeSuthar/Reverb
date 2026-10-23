const { Schema, model, models } = require("mongoose");

const staySchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
        },
        textChannelId: {
            type: String,
            required: true,
        },
        voiceChannelId: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = models.Stay || model("Stay", staySchema);

const {
    Schema, model, models
} = require("mongoose");
let config = require("../../../../config.reverb.js");

const guildSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
        },
        prefix: {
            type: String,
            required: true,
            default: config.bot?.prefix || "r!",
        },
        language: {
            type: String,
            default: "EnglishUS",
        },
        defaultVolume: {
            type: Number,
            default: 100,
            min: 0,
            max: config.music.maxVolume,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = models.Guild || model("Guild", guildSchema);

const { Schema, model, models } = require("mongoose");

const botSchema = new Schema(
    {
        botId: {
            type: String,
            required: true,
            unique: true,
        },
        totalPlaySong: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = models.Bot || model("Bot", botSchema);

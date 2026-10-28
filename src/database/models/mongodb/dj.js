const {
    Schema, model, models
} = require("mongoose");

const djSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            unique: true,
        },
        mode: {
            type: Boolean,
            required: true,
            default: false,
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

module.exports = models.Dj || model("Dj", djSchema);

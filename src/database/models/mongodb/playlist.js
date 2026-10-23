const { Schema, model, models } = require("mongoose");

const playlistSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        tracks: {
            type: [Schema.Types.Mixed],
            default: [],
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

playlistSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = models.Playlist || model("Playlist", playlistSchema);

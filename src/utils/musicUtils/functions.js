const {
    createCanvas, loadImage, GlobalFonts
} = require("@napi-rs/canvas");

function checkIfSearchResultIsPlaylist(searchResult) {
    if (searchResult.isPlaylist) return true;
    return false;
}

function checkIfURIIsYoutubeBased(url) {
    return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi.test(url);
}

function convertMillisecondsToTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = [
        hours > 0 ? String(hours).padStart(2, "0") : null,
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0"),
    ]
        .filter(Boolean)
        .join(":");

    return formattedTime;
}

/**
 * Parses duration or seek input strings.
 * Supports absolute formats ("1:30", "90s", "90", "1m 30s") and relative seek offsets
 * ("+30s", "-20s", "ahead 1m", "behind 15s", "forward 30s", "rewind 20s").
 *
 * When currentPos is provided:
 * Returns { sign, offsetMs, targetMs } or null if invalid.
 *
 * When currentPos is omitted (null):
 * Returns parsed duration in milliseconds (or 0 if invalid).
 *
 * @param {string} string - The duration or seek input string.
 * @param {number|null} [currentPos=null] - Current track playback position in ms.
 * @returns {number | { sign: number, offsetMs: number, targetMs: number } | null}
 */
function parseTime(string, currentPos = null) {
    const TIME_UNITS_MS = {
       d: 24 * 60 * 60 * 1000,
       h: 60 * 60 * 1000,
       m: 60 * 1000,
       s: 1000,
    };
    
    if (typeof string !== "string" || !string.trim()) {
        return currentPos !== null ? null : 0;
    }

    let raw = string.trim().toLowerCase();
    let sign = 0; // 0 = absolute, 1 = ahead, -1 = behind

    // Check prefix / suffix keywords and +/- signs
    if (/^(ahead|forward|fwd)\s+/i.test(raw)) {
        sign = 1;
        raw = raw.replace(/^(ahead|forward|fwd)\s+/i, "");
    } else if (/^(behind|back|backward|rewind)\s+/i.test(raw)) {
        sign = -1;
        raw = raw.replace(/^(behind|back|backward|rewind)\s+/i, "");
    } else if (/\s+(ahead|forward|fwd)$/i.test(raw)) {
        sign = 1;
        raw = raw.replace(/\s+(ahead|forward|fwd)$/i, "");
    } else if (/\s+(behind|back|backward|rewind)$/i.test(raw)) {
        sign = -1;
        raw = raw.replace(/\s+(behind|back|backward|rewind)$/i, "");
    } else if (raw.startsWith("+")) {
        sign = 1;
        raw = raw.substring(1).trim();
    } else if (raw.startsWith("-")) {
        sign = -1;
        raw = raw.substring(1).trim();
    }

    const isValidZero = /^(0+(?::0+)*s?)$/.test(raw);
    let parsedMs = 0;

    // Clock format: HH:MM:SS, MM:SS, or HH:MM.
    if (/^\d+(?::\d{1,2}){1,2}$/.test(raw)) {
        let parts = raw.split(":").map(Number);

        if (parts.some((part) => !Number.isSafeInteger(part))) {
            return currentPos !== null ? null : 0;
        }

        let seconds = 0;

        if (parts.length === 3) {
            let [hours, minutes, secs] = parts;

            if (minutes > 59 || secs > 59) return currentPos !== null ? null : 0;

            seconds = hours * 3600 + minutes * 60 + secs;
        } else {
            let [first, second] = parts;

            if (second > 59) return currentPos !== null ? null : 0;

            seconds = first * 60 + second;
        }

        parsedMs = seconds * 1000;
    }
    // Bare number: interpret as seconds.
    else if (/^\d+$/.test(raw)) {
        parsedMs = Number(raw) * 1000;
    }
    // Unit format: 1d 2h 30m 90s.
    else {
        let matches = [...raw.matchAll(/(\d+)\s*([dhms])/g)];

        if (!matches.length) {
            return currentPos !== null ? null : 0;
        }

        let remainder = raw.replace(/(\d+)\s*([dhms])/g, "").trim();

        if (remainder) {
            return currentPos !== null ? null : 0;
        }

        let units = matches.map((match) => match[2]);

        if (new Set(units).size !== units.length) {
            return currentPos !== null ? null : 0;
        }

        parsedMs = matches.reduce((total, match) => {
            let amount = Number(match[1]);
            let unit = match[2];

            return total + amount * TIME_UNITS_MS[unit];
        }, 0);
    }

    if (!Number.isSafeInteger(parsedMs) || (parsedMs <= 0 && !isValidZero)) {
        return currentPos !== null ? null : 0;
    }

    if (currentPos === null || currentPos === undefined) {
        return parsedMs;
    }

    let targetMs;
    if (sign === 1) {
        targetMs = currentPos + parsedMs;
    } else if (sign === -1) {
        targetMs = Math.max(0, currentPos - parsedMs);
    } else {
        targetMs = parsedMs;
    }

    return {
        sign,
        offsetMs: parsedMs,
        targetMs,
    };
}

function createProgressBar(
    current,
    total,
    emoji = {
        filled: "▬",
        empty: "▬",
        slider: "🔘",
        startline: null,
        endline: null,
    },
    size = 11,
) {
    if (total <= 0 || size <= 0) {
        return { bar: "", percent: 0 };
    }

    const percent = Math.min(
        100,
        Math.max(0, Math.round((current / total) * 100)),
    );

    const sliderPosition = Math.min(
        size - 1,
        Math.floor((percent / 100) * size),
    );

    const startline = emoji.startline ?? emoji.filled;
    const endline = emoji.endline ?? emoji.empty;

    const bar = Array.from({ length: size }, (_, i) => {
        if (i === sliderPosition) return emoji.slider;
        return i < sliderPosition ? emoji.filled : emoji.empty;
    }).join("");

    const showStartline = sliderPosition > 0;
    const showEndline = sliderPosition < size - 1;

    return {
        bar: `${showStartline ? startline : ""}${bar}${showEndline ? endline : ""}`,
        percent,
    };
}

async function createSpotifyCard({
    title,
    artist,
    album,
    image,
    start,
    end,
    border,
    overlayOpacity = 0,
    blur = 3,
    font = { name: "Manrope", path: undefined },
}) {
    if (!title || !artist || !start || !end) {
        throw new Error("Title, artist, start, and end are required.");
    }

    const formatTime = (time) => {
        if (!time) return "00:00";

        const totalSeconds = Math.floor(time / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const chunks = [
            String(days).padStart(2, "0"),
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0"),
        ];

        while (chunks.length > 2 && chunks[0] === "00") {
            chunks.shift();
        }

        return chunks.join(":");
    };

    const roundRect = (ctx, x, y, width, height, radius = 5) => {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.fill();
    };

    if (font.path) {
        GlobalFonts.registerFromPath(font.path, font.name);
    }

    const canvas = createCanvas(2000, 585);
    const ctx = canvas.getContext("2d");

    // Rounded card clipping
    ctx.beginPath();
    ctx.roundRect(25, 25, 1950, 535, 40);
    ctx.clip();

    // Background
    if (image) {
        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(await loadImage(image), 0, -500, 2000, 2000);
        ctx.filter = "none";
    } else {
        ctx.fillStyle = "#121212";
        ctx.fillRect(0, 0, 2000, 585);
    }

    // Overlay
    if (overlayOpacity > 0) {
        ctx.globalAlpha = overlayOpacity;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 2000, 585);
        ctx.globalAlpha = 1;
    }

    // Border
    if (border) {
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.strokeStyle = border;
        ctx.roundRect(15, 15, 1970, 555, 40);
        ctx.stroke();
    }

    // Progress bar
    const barWidth = 1400;
    const progress = Math.max(0, Math.min(start / end, 1)) * barWidth;

    ctx.fillStyle = "#6a625e";
    roundRect(ctx, 300, 400, barWidth, 8, 8);

    ctx.fillStyle = "#fff";
    roundRect(ctx, 300, 400, progress, 8, 8);

    // Artist
    ctx.fillStyle = "#94a3b8";
    ctx.font = `bold 28px ${font.name}`;
    ctx.textAlign = "center";
    ctx.fillText(
        artist.length >= 40 ? `${artist.slice(0, 40)}...` : artist,
        1000, 215
    );

    // Track title
    ctx.fillStyle = "#fff";
    ctx.font = `bold 50px ${font.name}`;
    ctx.fillText(
        title.length >= 40 ? `${title.slice(0, 40)}...` : title,
        1000, 285
    );

    // Album
    if (album) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = `30px ${font.name}`;
        ctx.fillText(
            album.length >= 40 ? `${album.slice(0, 40)}...` : album,
            1000, 350
        );
    }

    // Timestamps
    ctx.fillStyle = "#cbd5e1";
    ctx.font = `20px ${font.name}`;
    // use the convertMillisecondsToTime function to format the timestamps
    ctx.fillText(convertMillisecondsToTime(start > end ? end : start), 230, 412);
    ctx.fillText(convertMillisecondsToTime(end), 1782, 412);

    return canvas.toBuffer("image/png");
}

module.exports = {
    checkIfSearchResultIsPlaylist,
    checkIfURIIsYoutubeBased,
    convertMillisecondsToTime,
    parseTime,
    createProgressBar,
    createSpotifyCard
};

const util = require("util");

// ANSI TrueColor Escape Sequences
// Bot Brand Color: #FF66C4 (RGB: 255, 102, 196) - Hardcoded for branding
const MAIN_HEX = "#FF66C4";
const MAIN_COLOR = "\x1b[38;2;255;102;196m";
const MAIN_BOLD = "\x1b[1m\x1b[38;2;255;102;196m";
const MAIN_BG = "\x1b[48;2;255;102;196m\x1b[30m\x1b[1m";

const COLORS = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",

    // Brand Main (#FF66C4)
    main: MAIN_COLOR,
    mainBold: MAIN_BOLD,
    mainBg: MAIN_BG,

    // Uniform Palette
    gray: "\x1b[38;2;120;144;156m",
    darkGray: "\x1b[90m",
    white: "\x1b[97m",
    cyan: "\x1b[38;2;0;229;255m",
    cyanBold: "\x1b[1m\x1b[38;2;0;229;255m",
    yellow: "\x1b[38;2;255;193;7m",
    yellowBold: "\x1b[1m\x1b[38;2;255;193;7m",
    red: "\x1b[38;2;255;82;82m",
    redBold: "\x1b[1m\x1b[38;2;255;82;82m",
    green: "\x1b[38;2;0;230;118m",
    greenBold: "\x1b[1m\x1b[38;2;0;230;118m",
    blue: "\x1b[38;2;68;138;255m",
    blueBold: "\x1b[1m\x1b[38;2;68;138;255m",
    purple: "\x1b[38;2;179;136;255m",
    purpleBold: "\x1b[1m\x1b[38;2;179;136;255m",
    magenta: "\x1b[38;2;234;128;252m",
    magentaBold: "\x1b[1m\x1b[38;2;234;128;252m",
    indigo: "\x1b[38;2;124;77;255m",
    indigoBold: "\x1b[1m\x1b[38;2;124;77;255m",
    orange: "\x1b[38;2;255;152;0m",
    orangeBold: "\x1b[1m\x1b[38;2;255;152;0m",
    teal: "\x1b[38;2;0;188;212m",
    tealBold: "\x1b[1m\x1b[38;2;0;188;212m"
};

/**
 * Modern, cohesive ANSI Logger with hardcoded #FF66C4 branding.
 */
class Logger {
    constructor() {
        this.colors = COLORS;
        this.mainHex = MAIN_HEX;
        this.badgeWidth = 8; // Internal fixed padding width for labels
    }

    /**
     * Formats current time into [ HH:MM:SS ]
     * @returns {string}
     */
    _getTimestamp() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        return `${COLORS.darkGray}[ ${time} ]${COLORS.reset}`;
    }

    /**
     * Formats a badge label to exact fixed width for clean vertical alignment
     * @param {string} label 
     * @param {string} badgeColor 
     * @returns {string}
     */
    _getBadge(label, badgeColor) {
        const padded = label.toUpperCase().padEnd(this.badgeWidth, " ");
        return `${badgeColor}[ ${padded} ]${COLORS.reset}`;
    }

    /**
     * Formats arguments using util.formatWithOptions
     * @param {Array<any>} args 
     * @returns {string}
     */
    _formatArgs(args) {
        if (!args || args.length === 0) return "";
        return util.formatWithOptions({ colors: true, depth: 4 }, ...args);
    }

    /**
     * Core print method
     * @param {string} label 
     * @param {string} badgeColor 
     * @param {string|null} textColor 
     * @param {Array<any>} args 
     */
    _print(label, badgeColor, textColor, args) {
        const timestamp = this._getTimestamp();
        const badge = this._getBadge(label, badgeColor);
        const arrow = `${COLORS.darkGray}›${COLORS.reset}`;
        const content = this._formatArgs(args);

        if (textColor) {
            console.log(`${timestamp} ${badge} ${arrow} ${textColor}${content}${COLORS.reset}`);
        } else {
            console.log(`${timestamp} ${badge} ${arrow} ${content}`);
        }
    }

    /**
     * SUCCESS log - Hardcoded in the bot's main color (#FF66C4)
     */
    success(...args) {
        this._print("SUCCESS", COLORS.mainBold, COLORS.main, args);
    }

    /**
     * READY log - Hardcoded in the bot's main color (#FF66C4)
     */
    ready(...args) {
        this._print("READY", COLORS.mainBold, COLORS.main, args);
    }

    /**
     * INFO log - Bright Cyan
     */
    info(...args) {
        this._print("INFO", COLORS.cyanBold, null, args);
    }

    /**
     * WARN log - Bright Amber
     */
    warn(...args) {
        this._print("WARN", COLORS.yellowBold, COLORS.yellow, args);
    }

    /**
     * ERROR log - Bright Crimson Red with clean stack indentation
     */
    error(...args) {
        const timestamp = this._getTimestamp();
        const badge = this._getBadge("ERROR", COLORS.redBold);
        const arrow = `${COLORS.darkGray}›${COLORS.reset}`;

        const errors = args.filter((a) => a instanceof Error);
        const nonErrors = args.filter((a) => !(a instanceof Error));

        if (errors.length > 0) {
            const contextMsg = nonErrors.length > 0
                ? util.formatWithOptions({ colors: true, depth: 4 }, ...nonErrors)
                : "";

            for (const err of errors) {
                const header = contextMsg
                    ? `${contextMsg} ${err.name || "Error"}: ${err.message}`
                    : `${err.name || "Error"}: ${err.message}`;

                console.error(`${timestamp} ${badge} ${arrow} ${COLORS.redBold}${header}${COLORS.reset}`);
                if (err.stack) {
                    const lines = err.stack.split("\n").slice(1);
                    const formattedStack = lines
                        .map((line) => `  ${COLORS.darkGray}│${COLORS.reset} ${line.trim()}`)
                        .join("\n");
                    console.error(formattedStack);
                }
            }
        } else {
            console.error(`${timestamp} ${badge} ${arrow} ${COLORS.red}${util.formatWithOptions({ colors: true, depth: 4 }, ...args)}${COLORS.reset}`);
        }
    }

    /**
     * DEBUG log - Dim Gray
     */
    debug(...args) {
        this._print("DEBUG", COLORS.gray, COLORS.darkGray, args);
    }

    /**
     * DATABASE log - Emerald Green
     */
    database(...args) {
        this._print("DATABASE", COLORS.greenBold, null, args);
    }

    db(...args) {
        this.database(...args);
    }

    /**
     * MUSIC / LAVALINK log - Lavender / Purple
     */
    music(...args) {
        this._print("MUSIC", COLORS.purpleBold, null, args);
    }

    /**
     * COMMAND log - Dodger Blue
     */
    command(...args) {
        this._print("COMMAND", COLORS.blueBold, null, args);
    }

    cmd(...args) {
        this.command(...args);
    }

    /**
     * EVENT log - Neon Magenta
     */
    event(...args) {
        this._print("EVENT", COLORS.magentaBold, null, args);
    }

    /**
     * HANDLER log - Deep Violet / Indigo
     */
    handler(...args) {
        this._print("HANDLER", COLORS.indigoBold, null, args);
    }

    /**
     * CLIENT log - Brand Main Color (#FF66C4)
     */
    client(...args) {
        this._print("CLIENT", COLORS.mainBold, null, args);
    }

    /**
     * SHARD log - Warm Amber Orange
     */
    shard(...args) {
        this._print("SHARD", COLORS.orangeBold, null, args);
    }

    /**
     * REST log - Teal
     */
    rest(...args) {
        this._print("REST", COLORS.tealBold, null, args);
    }

    /**
     * Custom tag logger
     */
    custom(tag, colorCode, ...args) {
        this._print(tag, colorCode || COLORS.mainBold, null, args);
    }

    /**
     * Standard console.log alias
     */
    log(...args) {
        this.info(...args);
    }

    /**
     * Pretty divider line in brand main color
     */
    divider(char = "─", length = 75) {
        console.log(`${COLORS.main}${char.repeat(length)}${COLORS.reset}`);
    }

    /**
     * Cool Banner display
     */
    banner(title = "REVERB MUSIC BOT") {
        const line = "═".repeat(60);
        console.log(`${COLORS.mainBold}╔${line}╗${COLORS.reset}`);
        const padLength = Math.max(0, Math.floor((60 - title.length) / 2));
        const centered = " ".repeat(padLength) + title + " ".repeat(Math.max(0, 60 - title.length - padLength));
        console.log(`${COLORS.mainBold}║${centered}║${COLORS.reset}`);
        console.log(`${COLORS.mainBold}╚${line}╝${COLORS.reset}`);
    }
}

// Singleton instance
const logger = new Logger();

// Support both `const logger = require(...)` and `const { logger, Logger } = require(...)`
module.exports = logger;
module.exports.logger = logger;
module.exports.Logger = Logger;
module.exports.default = logger;

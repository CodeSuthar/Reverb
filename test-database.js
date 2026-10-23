const assert = require("assert");
const fs = require("fs");
const path = require("path");
const DatabaseManager = require("./src/database/DatabaseManager");

async function runTestSuite(providerType, config) {
    console.log(`\n========================================`);
    console.log(`Testing Provider: ${providerType.toUpperCase()}`);
    console.log(`========================================`);

    const db = new DatabaseManager(config, { prefix: "r!" });
    await db.connect();
    console.log(`[PASS] Connected successfully to ${providerType}`);

    const runId = Date.now().toString().slice(-10);
    const guildId = `1154789${runId}`; // 19-digit Discord snowflake
    const userId = `2254789${runId}`;
    const botId = `3354789${runId}`;

    // 1. Guild Repository
    console.log(`-> Testing Guild Repository...`);
    const defaultGuild = await db.guild.get(guildId);
    assert.strictEqual(defaultGuild.guildId, guildId);
    assert.strictEqual(defaultGuild.prefix, "r!");
    assert.strictEqual(defaultGuild.defaultVolume, 100);

    await db.guild.setPrefix(guildId, "re!");
    const updatedPrefix = await db.guild.getPrefix(guildId);
    assert.strictEqual(updatedPrefix, "re!");

    await db.guild.updateLanguage(guildId, "Spanish");
    const updatedLang = await db.guild.getLanguage(guildId);
    assert.strictEqual(updatedLang, "Spanish");

    await db.guild.setDefaultVolume(guildId, 80);
    const updatedVol = await db.guild.getDefaultVolume(guildId);
    assert.strictEqual(updatedVol, 80);
    console.log(`[PASS] Guild Repository operations verified.`);

    // 2. DJ Repository
    console.log(`-> Testing DJ Repository...`);
    await db.dj.clearAll(guildId);
    const initialDj = await db.dj.get(guildId);
    assert.strictEqual(initialDj.mode, false);
    assert.deepStrictEqual(initialDj.roles, []);
    assert.deepStrictEqual(initialDj.users, []);

    await db.dj.setMode(guildId, true);
    const setDj = await db.dj.get(guildId);
    assert.strictEqual(setDj.mode, true);

    await db.dj.addRole(guildId, "role-999");
    const withRole = await db.dj.get(guildId);
    assert.strictEqual(withRole.roles.includes("role-999"), true);

    await db.dj.addUser(guildId, "user-888");
    const withUser = await db.dj.get(guildId);
    assert.strictEqual(withUser.users.includes("user-888"), true);

    await db.dj.removeRole(guildId, "role-999");
    const afterRemoveRole = await db.dj.get(guildId);
    assert.strictEqual(afterRemoveRole.roles.length, 0);
    assert.strictEqual(afterRemoveRole.users.includes("user-888"), true);

    await db.dj.removeUser(guildId, "user-888");
    const afterRemoveUser = await db.dj.get(guildId);
    assert.strictEqual(afterRemoveUser.users.length, 0);

    // Test clear helpers
    await db.dj.addRole(guildId, "role-111");
    await db.dj.addUser(guildId, "user-222");
    await db.dj.clearAll(guildId);
    const afterClearAll = await db.dj.get(guildId);
    assert.strictEqual(afterClearAll.roles.length, 0);
    assert.strictEqual(afterClearAll.users.length, 0);
    assert.strictEqual(afterClearAll.mode, false);
    console.log(`[PASS] DJ Repository operations (roles + users) verified.`);

    // 3. Stay (24/7) Repository
    console.log(`-> Testing Stay Repository...`);
    const initialStay = await db.stay.get(guildId);
    assert.strictEqual(initialStay, null);

    await db.stay.set(guildId, "text-chan-1", "voice-chan-2");
    const activeStay = await db.stay.get(guildId);
    assert.strictEqual(activeStay.textChannelId, "text-chan-1");
    assert.strictEqual(activeStay.voiceChannelId, "voice-chan-2");
    assert.strictEqual(activeStay.textId, "text-chan-1");
    assert.strictEqual(activeStay.voiceId, "voice-chan-2");

    const allStays = await db.stay.getAll();
    assert(allStays.some((s) => s.guildId === guildId && s.textChannelId === "text-chan-1"));

    await db.stay.delete(guildId);
    const deletedStay = await db.stay.get(guildId);
    assert.strictEqual(deletedStay, null);
    console.log(`[PASS] Stay Repository operations verified.`);

    // 4. Role Operations (via merged DJ repository)
    console.log(`-> Testing Role Operations (Merged DJ)...`);
    const initialRoles = await db.getRoles(guildId);
    assert.strictEqual(initialRoles.length, 0);

    await db.addRole(guildId, "role-999");
    await db.addRole(guildId, "role-999"); // Idempotent check
    const rolesAfterAdd = await db.getRoles(guildId);
    assert.strictEqual(rolesAfterAdd.length, 1);
    assert.strictEqual(rolesAfterAdd[0], "role-999");

    await db.removeRole(guildId, "role-999");
    const rolesAfterRemove = await db.getRoles(guildId);
    assert.strictEqual(rolesAfterRemove.length, 0);
    console.log(`[PASS] Role operations verified.`);

    // 5. Playlist Repository
    console.log(`-> Testing Playlist Repository...`);
    const playlistName = "Chill Vibes";
    await db.playlist.create(userId, playlistName);
    const emptyPlaylist = await db.playlist.get(userId, playlistName);
    assert.strictEqual(emptyPlaylist.name, playlistName);
    assert.deepStrictEqual(emptyPlaylist.tracks, []);

    await db.playlist.addTracks(userId, playlistName, ["track_A", "track_B"]);
    const withTracks = await db.playlist.getTracks(userId, playlistName);
    assert.deepStrictEqual(withTracks, ["track_A", "track_B"]);

    await db.playlist.removeTrack(userId, playlistName, "track_A");
    const afterRemoveTrack = await db.playlist.getTracks(userId, playlistName);
    assert.deepStrictEqual(afterRemoveTrack, ["track_B"]);

    const userPlaylists = await db.playlist.getUserPlaylists(userId);
    assert(userPlaylists.some((p) => p.name === playlistName));

    await db.playlist.delete(userId, playlistName);
    const deletedPlaylist = await db.playlist.get(userId, playlistName);
    assert.strictEqual(deletedPlaylist, null);
    console.log(`[PASS] Playlist Repository operations verified.`);

    // 6. Setup Repository
    console.log(`-> Testing Setup Repository...`);
    const initialSetup = await db.setup.get(guildId);
    assert.strictEqual(initialSetup, null);

    await db.setup.set(guildId, {
        parentChannelId: "parent-chan-1",
        textChannelId: "setup-chan-1",
        voiceChannelId: "voice-chan-1",
        messageId: "setup-msg-1",
    });
    const activeSetup = await db.setup.get(guildId);
    assert.strictEqual(activeSetup.textChannelId, "setup-chan-1");
    assert.strictEqual(activeSetup.textId, "setup-chan-1");
    assert.strictEqual(activeSetup.parentChannelId, "parent-chan-1");
    assert.strictEqual(activeSetup.voiceChannelId, "voice-chan-1");
    assert.strictEqual(activeSetup.messageId, "setup-msg-1");

    const allSetups = await db.setup.getAll();
    assert.strictEqual(Array.isArray(allSetups), true);
    assert.strictEqual(allSetups.length >= 1, true);

    const facadeAllSetups = await db.getSetup();
    assert.strictEqual(Array.isArray(facadeAllSetups), true);
    assert.strictEqual(facadeAllSetups.length >= 1, true);

    await db.setup.delete(guildId);
    const deletedSetup = await db.setup.get(guildId);
    assert.strictEqual(deletedSetup, null);
    console.log(`[PASS] Setup Repository operations verified.`);

    // 7. Bot Repository
    console.log(`-> Testing Bot Repository...`);
    const initialBot = await db.bot.get(botId);
    assert.strictEqual(initialBot.botId, botId);
    assert.strictEqual(initialBot.totalPlaySong, 0);

    const inc1 = await db.bot.incrementSongsPlayed(botId, 3);
    assert.strictEqual(inc1, 3);

    const inc2 = await db.bot.incrementSongsPlayed(botId, 2);
    assert.strictEqual(inc2, 5);

    const botAfter = await db.bot.get(botId);
    assert.strictEqual(botAfter.totalPlaySong, 5);
    console.log(`[PASS] Bot Repository operations verified.`);

    // 8. Facade / Shorthand Check
    console.log(`-> Testing Facade Shorthands...`);
    assert.strictEqual(await db.getPrefix(guildId), "re!");
    assert.strictEqual(await db.getLanguage(guildId), "Spanish");
    assert.strictEqual(await db.getDefaultVolume(guildId), 80);
    const djFacade = await db.getDJ(guildId);
    assert.strictEqual(typeof djFacade.mode, "boolean");
    assert.strictEqual(Array.isArray(djFacade.roles), true);
    console.log(`[PASS] Facade methods verified.`);

    // Cleanup & Disconnect
    await db.guild.delete(guildId);
    await db.disconnect();
    console.log(`[PASS] Disconnected cleanly.`);
}

async function main() {
    console.log("Starting Reverb Multi-Database Verification Test Suite...");

    const testDbPath = "./data/test-reverb.db";

    try {
        // Test SQLite
        await runTestSuite("sqlite", {
            provider: "sqlite",
            sqlite: { path: testDbPath },
        });

        // Test PGlite (in-memory)
        await runTestSuite("pglite", {
            provider: "pglite",
            pglite: { dataDir: "memory://" },
        });

        console.log(`\n========================================`);
        console.log(`ALL TEST SUITES PASSED PERFECTLY!`);
        console.log(`========================================\n`);
    } catch (err) {
        console.error(`\n[FATAL TEST FAILURE]:`, err);
        process.exit(1);
    } finally {
        // Cleanup test SQLite files if they exist
        try {
            if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
            if (fs.existsSync(`${testDbPath}-wal`)) fs.unlinkSync(`${testDbPath}-wal`);
            if (fs.existsSync(`${testDbPath}-shm`)) fs.unlinkSync(`${testDbPath}-shm`);
        } catch {
            // Ignore cleanup error
        }
    }
}

main();

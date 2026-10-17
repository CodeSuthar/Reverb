 <p align="center">
  <img src="./docs/public/Reverb-Banner.png" alt="Reverb Logo" width="512">
</p>

<h1 align="center">Reverb</h1>

<p align="center">
  <a href="https://github.com/CodeSuthar/Reverb/releases">
    <img src="https://img.shields.io/github/v/release/CodeSuthar/Reverb?style=for-the-badge&color=blue&logo=github" alt="Latest Release">
  </a>
  <a href="https://github.com/CodeSuthar/Reverb/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/CodeSuthar/Reverb?style=for-the-badge&color=blue" alt="License">
  </a>
  <br>
  <img src="https://img.shields.io/badge/Language-JavaScript-yellow?style=for-the-badge&logo=javascript" alt="Language">
  <a href="https://github.com/CodeSuthar/Reverb/stargazers">
    <img src="https://img.shields.io/github/stars/CodeSuthar/Reverb?style=for-the-badge&color=yellow&logo=github" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <b>Reverb</b> is an open-source Discord music bot currently under development in <b>JavaScript</b>.
  <br>
  Built with a focus on reliability, music discovery, accurate track matching, and a better user experience.
</p>

---

## Roadmap

Reverb is actively being rebuilt. This roadmap outlines the current implementation, completed work, and features still in progress. Priorities may change as development continues.

### Step 1: Command Handler

* [x] Build the foundational command handler.
* [x] Reuse and refine ideas from previous projects, including Zeon, SynthMusic, and the older Reverb handler.
* [x] Establish the foundation for registering and executing commands.
* [x] Implement command and slash-command loading infrastructure.
* [ ] Expand command validation and improve error handling.
* [ ] Add automated tests for command execution and argument parsing.

### Step 2: Unified Music Search

Build a unified search system that discovers music across multiple providers, matches playable tracks against reference metadata, and ranks results by relevance.

#### Spotify Reference

* [x] Retrieve Spotify track metadata for reference matching.
* [x] Use the reference title, artists, and duration to evaluate playable candidates.
* [x] Keep Spotify reference-only instead of treating Spotify results as playable audio.
* [x] Run Spotify reference discovery concurrently with YouTube Music discovery.
* [x] Handle reference failures and timeouts without unnecessarily blocking candidate discovery.

#### YouTube Music Integration

* [x] Use `youtubei.js` to discover YouTube Music songs.
* [x] Resolve discovered songs through Lavalink into playable tracks.
* [x] Preserve YouTube Music artist metadata for matching.
* [x] Prioritise YouTube Music results when a sufficiently strong match is found.
* [x] Avoid performing an unnecessary default Lavalink search before processing plain-text queries.

#### Tiered Provider Search

* [x] **Tier 1:** Search YouTube Music and Spotify reference metadata concurrently.
* [x] Return immediately when a candidate reaches the configured high-confidence score.
* [x] **Tier 2:** Search YouTube and SoundCloud concurrently when Tier 1 does not find a satisfactory match.
* [x] Skip the extended fallback tier when Tier 2 produces a sufficiently strong candidate.
* [x] **Tier 3:** Search Apple Music, Deezer, Tidal, JioSaavn, Bandcamp, and the default Lavalink source when earlier tiers are insufficient.
* [x] Run providers within each fallback tier concurrently.
* [x] Reduce Tier 2 and Tier 3 fallback timeouts to 2 seconds.
* [x] Handle individual provider failures without immediately aborting the entire search.

#### Matching and Ranking

* [x] Score candidates using title similarity, artist similarity, and duration differences.
* [x] Apply a duration-match bonus to YouTube Music candidates.
* [x] Rank candidates against Spotify reference metadata when available.
* [x] Preserve the existing scoring weights: title (50), artist (30), duration (20), and YouTube Music bonus (25).
* [x] Precompute reference metadata and normalized text tokens once per query.
* [x] Reuse precomputed reference data across candidate scoring.
* [x] Deduplicate candidates using track URIs and identifiers.
* [x] Preserve playable track information while attaching reference metadata.
* [x] Return up to five candidates in the final search results.

#### Search Performance — Ongoing

* [x] Provide a unified search system that discovers music across multiple providers and ranks results by relevance which results in a 99%+ matching accuracy.
* [ ] Improve the search pipeline's time complexity.
* [ ] Improve the search pipeline's performance and reduce the time taken to load playlists.

**Current challenge:** A playlist containing approximately 15 tracks can still take around 20 seconds to load. The goal is to make Reverb faster without sacrificing the matching accuracy that the tiered search system is designed to provide.

### Step 3: Music Commands

Implement and refine the core music controls and connect them to Reverb's player and queue system.

#### Message Commands

* [x] `join` — Join the user's voice channel.
* [x] `leave` — Leave the voice channel and clean up the player.
* [x] `play` — Search for music and add tracks to the queue.
* [ ] `pause` — Pause playback.
* [ ] `resume` — Resume playback.
* [ ] `skip` — Skip the current track.
* [ ] `stop` — Stop playback and handle queue cleanup.
* [ ] `queue` — Display queued tracks.
* [ ] `nowplaying` — Display information about the current track.
* [ ] `volume` — Adjust playback volume.
* [ ] `loop` — Configure track or queue looping.
* [ ] `shuffle` — Shuffle the queue.

#### Slash Commands

* [x] `join` — Create a player using the current music manager.
* [x] `leave` — Destroy the player through the current music manager.
* [x] `play` — Use the unified Reverb search system.
* [x] Add voice-channel checks and consistent response embeds.
* [x] Reuse shared music utilities for URL detection, playlist detection, and duration formatting.
* [ ] Complete the remaining slash music commands.
* [ ] Keep message and slash command behavior consistent.
* [ ] Improve command-level error handling and user feedback.

Additional music commands will be added as the player system evolves.

### Step 4: TypeScript Migration

JavaScript is being used while the architecture evolves. A migration to TypeScript is planned once the core implementation becomes more stable.

* [ ] Establish migration requirements and a practical strategy.
* [ ] Introduce TypeScript when the core architecture is ready.
* [ ] Add types for the client, manager, player, queues, and search results.
* [ ] Improve maintainability and catch more errors during development.
* [ ] Update development tooling and documentation.

*The migration may happen earlier if it becomes beneficial.*

### Step 5: Web Dashboard

Build a web dashboard to make Reverb easier to configure and manage.

* [ ] Establish the dashboard's server-side architecture.
* [ ] Use EJS for server-rendered pages.
* [ ] Add Discord authentication and appropriate access controls.
* [ ] Provide guild-specific music configuration.
* [ ] Add dashboard pages for supported settings and features.
* [ ] Keep the dashboard lightweight without introducing a frontend framework unnecessarily.

---

## A Note From the Developer

Reverb is a side project, but it's also something precious to me.

I started developing it again because I wanted to work on something Discord-related after years away from bot development. Over time, I've moved on to AI, web development, and exploring new technologies and programming languages like Rust. But honestly, there's something about coming back to an old project that makes you want to give it another shot.

And I still have a soft spot for Reverb.

However, there's some history behind this project, and I don't want to pretend it doesn't exist.

### What happened back then?

A few years ago, Reverb was being run by two of us. We were both young and, honestly, pretty immature back then.

To explain what actually happened, my co-developer was from the UK, while I live in India. At some point, he trusted another person and added them to our Discord team. That third person ended up nuking servers, and the whole situation turned into a mess.

**Where was I when all of this happened? I was literally asleep.**

Because of the time difference, I wasn't even awake when the incident took place. I woke up, came online, and had to figure out what had happened. Everything was a mess, and as a kid, I was more concerned about Reverb itself than about the people whose servers had been affected.

And that's the part I regret the most.

I wasn't the person who carried out the nuking, but that doesn't mean my reaction afterward was something I'm proud of. Instead of properly thinking about the people affected, understanding the damage, and showing genuine remorse, I was too caught up in what had happened to our bot.

We were so focused on ourselves that we failed to give the affected communities the consideration they deserved.

Looking back, I realise how stupid and irresponsible we were. We didn't take things as seriously as we should have, and I don't think we showed the level of remorse or accountability that the situation deserved.

Maybe we didn't fully understand the seriousness of what had happened at that age. Maybe our apologies weren't good enough, or maybe we simply didn't show the remorse people deserved to see from us.

Whatever the reason, I'm not going to use my age, the time difference, or the fact that I wasn't present during the incident as an excuse.

**I'm genuinely sorry to the people whose servers and communities were affected.**

I can't change what happened, and I don't expect everyone to forgive me or forget about it. I also understand that an apology doesn't automatically repair the damage or restore trust.

I'm not writing this to justify what happened or make myself look better. I just don't want to rebuild Reverb while pretending its past never existed.

### Why bring Reverb back?

Because, despite everything, I still love this project.

Reverb was a part of my life when I was much younger, and returning to it gives me a chance to work on something I genuinely care about while applying what I've learned since then.

This time, I want to approach development differently. I want to be transparent about how the project is built, keep the source code available for everyone to inspect, and take the responsibility that comes with building software for other people more seriously.

I know that saying I've changed doesn't prove anything. That's something I'll have to demonstrate through my actions and how I handle this project going forward.

And yes, **Reverb will be available as a Discord music bot again.**

I'm rebuilding it because I want to, because I enjoy working on it, and because I want to give this project another chance — hopefully in a much better form than before.

### Why open source?

Honestly, why not?

I wanted to build something that anyone could use, learn from, or contribute to. It's a music bot, not some secret technology that needs to be locked away. What's the fun in gatekeeping a project that other people could learn something from?

Open source also means people can inspect the code, report issues, suggest improvements, and contribute instead of having to blindly trust what the developer says.

That's the kind of project I want Reverb to be.

### Want to look into my past stupidity?

If you want to understand more about the history behind all of this, you can watch the video below.

I'm sharing it because I don't want to hide the past behind the project. Feel free to look into it yourself and form your own opinion.

<p align="center">
  <a href="https://www.youtube.com/watch?v=S9fjpiBx54o">
    <img src="https://img.youtube.com/vi/S9fjpiBx54o/hqdefault.jpg" alt="Watch the video about Reverb's history" width="560">
  </a>
  <br>
  <a href="https://www.youtube.com/watch?v=S9fjpiBx54o">Watch on YouTube</a>
</p>

---

## Tech Stack

Reverb is currently being developed using the following technologies:

* **JavaScript** — The primary development language during the current development phase.
* **discord.js** — Discord client, message commands, and slash commands.
* **Lavalink** — Audio playback infrastructure.
* **`lavalink-client`** — Communication with Lavalink and management of music players.
* **`youtubei.js`** — YouTube Music discovery and song metadata.
* **MongoDB / Mongoose** — Database infrastructure.
* **EJS** — Planned templating engine for the future web dashboard.

Music discovery uses multiple Lavalink-compatible providers. Spotify is used as a metadata reference rather than a direct playback source.

The stack may evolve as development continues.

## Contributing

Reverb is open source, and contributions are welcome!

If you find a bug, have an idea for a feature, or want to improve something, feel free to open an issue or submit a pull request.

A few things to keep in mind:

* Explain your changes clearly.
* Report bugs with enough information to reproduce them.
* Keep contributions focused and easy to review.
* Be respectful of other contributors.

The project is still evolving, so feedback and suggestions are always appreciated.

## Disclaimer

Reverb is an independent, community-oriented project currently under development. Features, supported music sources, and implementation details may change over time.

The project is not affiliated with Discord, Spotify, YouTube, SoundCloud, Apple Music, Deezer, Tidal, JioSaavn, or Bandcamp.

---

Thanks for taking the time to check out Reverb.

Whether you're here because of its history, its code, or the music bot itself, I appreciate you giving the project a look.

**Let's see what Reverb can become this time.**

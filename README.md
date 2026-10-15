 <p align="center">
  <img src="./docs/public/Reverb-Banner.png" alt="Reverb Logo" width="512" style="border-radius: 50px;">
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

---

<p align="center">
  <b>Reverb</b> is an open-source Discord music bot currently being developed in <b>JavaScript (for now)</b>.<br>
  Built with a focus on reliability, music discovery, and a better user experience.
</p>

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

## Roadmap

Reverb is still under active development. This roadmap reflects what I'm currently working on, and things may change as the project evolves.

* [x] **Step 1: Command Handler**

  * Build a command handler for Reverb, reusing and cleaning up ideas from my older bots, including Zeon, SynthMusic, and the older Reverb handler.

* [ ] **Step 2: Unified Music Search**

  * Build a search system that collects results from supported platforms such as Spotify, YouTube, and SoundCloud.
  * Rank results based on relevance, including track names, artists, and other metadata.
  * Prioritise official music releases and YouTube Music results over unrelated regular YouTube videos whenever possible.
  * Use `youtubei.js` to discover suitable music results.
  * Convert YouTube Music links when necessary so they can be passed to the player correctly.

* [ ] **Step 3: Music Commands**

  * Implement the core music commands, including:

    * `play`
    * `pause`
    * `resume`
    * `skip`
    * `stop`
    * `queue`
    * `nowplaying`
    * `volume`
    * `loop`
    * `shuffle`
  * Add more commands as the project develops.

* [ ] **Step 4: TypeScript Migration**

  * Start with JavaScript while the architecture is still evolving, then migrate to TypeScript when it makes sense.
  * Improve maintainability, catch more errors during development, and make the codebase easier to work with as the project grows.
  * I might switch to TypeScript earlier if I feel it makes more sense. Nothing is set in stone yet.

* [ ] **Step 5: Web Dashboard**

  * Build a web dashboard to make Reverb easier to configure and manage.
  * Use EJS for server-rendered pages instead of introducing React, Vue, or Angular when a simpler solution will do the job.

---

## Tech Stack

The project is currently being developed using:

* **JavaScript** — the primary development language for now.
* **Lavalink** — for audio delivery and playback infrastructure.
* **`lavalink-client`** — for interacting with Lavalink from the bot.
* **`youtubei.js`** — for YouTube and YouTube Music discovery.
* **EJS** — planned for the future web dashboard.

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

The project is not affiliated with Discord, Spotify, YouTube, or SoundCloud.

---

Thanks for taking the time to check out Reverb.

Whether you're here because of its history, its code, or the music bot itself, I appreciate you giving the project a look.

**Let's see what Reverb can become this time.**
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
    defineConfig({
        base: process.env.VITEPRESS_BASE || "/",
        title: "Reverb",
        description: "Modern Discord Music Bot documentation powered by discord.js v14, Moonlink.js, and NodeLink.",
        cleanUrls: true,
        ignoreDeadLinks: true,
        head: [
            ["link", { rel: "icon", href: "/Reverb.png" }],
            ["meta", { name: "theme-color", content: "#FF66C4" }]
        ],

        mermaid: {
            securityLevel: "loose",
            startOnLoad: false,
            theme: "base",
            themeVariables: {
                primaryColor: "#FFF2F9",
                primaryBorderColor: "#FF66C4",
                primaryTextColor: "#2B1824",
                lineColor: "#FF66C4",
                secondaryColor: "#FDF2F8",
                tertiaryColor: "#FFF8FC",
                edgeLabelBackground: "#FFFFFF",
                clusterBkg: "#FFF8FC",
                clusterBorder: "#FFB3DF",
                mainBkg: "#FFF2F9",
                nodeBorder: "#FF66C4",
                actorBkg: "#FFF2F9",
                actorBorder: "#FF66C4",
                actorTextColor: "#2B1824",
                actorLineColor: "#FF66C4",
                signalColor: "#FF66C4",
                signalTextColor: "#2B1824",
                labelBoxBkgColor: "#FFF2F9",
                labelBoxBorderColor: "#FF66C4",
                labelTextColor: "#2B1824",
                loopTextColor: "#2B1824",
                noteBorderColor: "#E6B800",
                noteBkgColor: "#FFFDF5",
                noteTextColor: "#3D3200",
                activationBorderColor: "#FF66C4",
                activationBkgColor: "#FFE0F0",
                sequenceNumberColor: "#FFFFFF"
            }
        },
        mermaidPlugin: {
            class: "mermaid"
        },

    themeConfig: {
        logo: "/Reverb.png",
        siteTitle: "Reverb",

        nav: [
            { text: "Getting Started", link: "/getting-started/prerequisites" },
            {
                text: "Audio Setup",
                items: [
                    { text: "⚡ NodeLink Setup (Recommended)", link: "/getting-started/nodelink-setup" },
                    { text: "🌙 Moonlink.js Client Guide", link: "/getting-started/moonlink" },
                    { text: "🔊 Lavalink v4 Setup (Alternative)", link: "/getting-started/lavalink-setup" }
                ]
            },
            { text: "Commands (59)", link: "/features/commands-guide" },
            {
                text: "Configuration",
                items: [
                    { text: "Environment Variables (.env)", link: "/configuration/environment" },
                    { text: "Bot Config (config.reverb.js)", link: "/configuration/bot-config" },
                    { text: "Database & Storage Layer", link: "/configuration/database" }
                ]
            },
            {
                text: "Architecture",
                items: [
                    { text: "System Architecture", link: "/architecture/overview" },
                    { text: "Events & Dispatching", link: "/architecture/events" }
                ]
            },
            { text: "The Story", link: "/about/story" },
            { text: "✨ Invite Bot", link: "https://discord.com/oauth2/authorize?client_id=1558414328456020028&permissions=281891692735824&integration_type=0&scope=bot+applications.commands" },
            { text: "Support", link: "https://discord.gg/6UwVYHu2zu" }
        ],

        sidebar: [
            {
                text: "🚀 Getting Started",
                collapsed: false,
                items: [
                    { text: "System Prerequisites", link: "/getting-started/prerequisites" },
                    { text: "Discord Developer Portal", link: "/getting-started/discord-portal" },
                    { text: "⚡ NodeLink Setup (Recommended)", link: "/getting-started/nodelink-setup" },
                    { text: "🌙 Moonlink.js Client Library", link: "/getting-started/moonlink" },
                    { text: "🔊 Lavalink v4 Setup (Alternative)", link: "/getting-started/lavalink-setup" },
                    { text: "Installation & First Boot", link: "/getting-started/installation" }
                ]
            },
            {
                text: "⚙️ Configuration",
                collapsed: false,
                items: [
                    { text: "Environment Variables (.env)", link: "/configuration/environment" },
                    { text: "Bot Settings (config.reverb.js)", link: "/configuration/bot-config" },
                    { text: "Database & Storage Layer", link: "/configuration/database" }
                ]
            },
            {
                text: "🎛️ Features & Commands",
                collapsed: false,
                items: [
                    { text: "📜 Command Reference (59 Commands)", link: "/features/commands-guide" },
                    { text: "🎵 Music Engine & Audio Pipeline", link: "/features/music-system" },
                    { text: "📻 Dedicated Song Requests Channel", link: "/features/setup-channel" },
                    { text: "🛠️ Guild Customization & DJ System", link: "/features/customization" }
                ]
            },
            {
                text: "🏗️ System Architecture",
                collapsed: true,
                items: [
                    { text: "System Architecture & Lifecycle", link: "/architecture/overview" },
                    { text: "Event Dispatching & Music Events", link: "/architecture/events" }
                ]
            },
            {
                text: "🩺 Troubleshooting",
                collapsed: true,
                items: [
                    { text: "Frequently Asked Questions (FAQ)", link: "/troubleshooting/faq" },
                    { text: "Error Solutions Guide", link: "/troubleshooting/errors" }
                ]
            },
            {
                text: "📖 About Reverb",
                collapsed: false,
                items: [
                    { text: "The Reverb Story & Roadmap", link: "/about/story" }
                ]
            }
        ],

        socialLinks: [
            { icon: "github", link: "https://github.com/CodeSuthar/Reverb" },
            { icon: "discord", link: "https://discord.gg/6UwVYHu2zu" }
        ],

        footer: {
            message: 'Released under the <a href="https://github.com/CodeSuthar/Reverb/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" style="color: #FF66C4; font-weight: 600;">Apache 2.0 License</a>. Fully Open Source.',
            copyright: 'Copyright © 2026 — maintained by <span style="color: #FF66C4; font-weight: 600;">The Reverb Team</span> and <a href="https://github.com/CodeSuthar" target="_blank" rel="noopener noreferrer" style="color: #FF66C4; font-weight: 600;">CodeSuthar</a>'
        },

        search: {
            provider: "local"
        }
    }
}));

# Security Policy

## Reporting Security Vulnerabilities

The Reverb team takes the security of our bot, database layer, and user data seriously. If you discover a security vulnerability or sensitive exploit within Reverb, please report it privately.

**Please do NOT disclose security vulnerabilities via public GitHub issues, discussions, or public Discord messages.**

### How to Report

1. **GitHub Security Advisory (Preferred)**:
   Navigate to the **Security** tab of [https://github.com/CodeSuthar/Reverb](https://github.com/CodeSuthar/Reverb) and click **"Report a vulnerability"** to submit a private draft advisory.
2. **Direct Contact**:
   If private vulnerability reporting is unavailable, reach out directly to the repository maintainer (**CodeSuthar**) on GitHub or Discord.

Please include:
- A detailed description of the vulnerability.
- Steps to reproduce or proof of concept.
- Potential impact on bot instances, guild configurations, or host servers.

---

## Token & Credential Safety Guidelines

If you are self-hosting Reverb:
1. **Never commit `.env`**: Ensure your `.env` file containing `CLIENT_TOKEN`, `CLIENT_SECRET`, and database connection strings is strictly kept in `.gitignore`.
2. **Bot Token Invalidation**: If you suspect your Discord bot token was compromised or accidentally pushed, **immediately reset the token** in the [Discord Developer Portal](https://discord.com/developers/applications).
3. **Database Safeguards**: Protect your PostgreSQL, MongoDB, or MySQL server with strong authentication and bind to localhost unless strictly necessary.

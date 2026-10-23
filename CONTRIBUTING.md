# Contributing to Reverb

Thank you for your interest in contributing to **Reverb**! We welcome bug reports, documentation enhancements, feature proposals, and code contributions.

---

## Getting Started

1. **Fork the Repository**:
   Fork [https://github.com/CodeSuthar/Reverb](https://github.com/CodeSuthar/Reverb) to your personal GitHub account.

2. **Clone your Fork**:
   ```bash
   git clone https://github.com/CodeSuthar/Reverb.git
   cd Reverb
   ```

3. **Install Dependencies**:
   Reverb uses `pnpm` as its default package manager:
   ```bash
   pnpm install
   ```
   *(npm and yarn are also fully supported).*

4. **Set Up Local Configuration**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your test Discord Bot token and client credentials.

---

## Development Workflow

### Testing the Database & Repositories
Reverb includes an automated test suite verifying SQLite and PGlite database operations:
```bash
node test-database.js
```
Ensure all tests pass before submitting changes to repository or schema logic.

### Working on Documentation
The documentation is powered by **VitePress**:
```bash
# Start local docs development server with hot-reload
pnpm run docs:dev

# Test production docs build
pnpm run docs:build
```

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names (e.g. `feat/filters-eq`, `fix/voice-reconnect`, `docs/database-guide`).
2. **Commit Messages**: Keep commit messages concise and informative.
3. **No Secrets**: Double check that no tokens, API keys, or `.env` files are included in your commits.
4. **Test Coverage**: Run `node test-database.js` and `pnpm run docs:build` to confirm there are no broken links, syntax errors, or regression bugs.

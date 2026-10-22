# Contributing to Aegis Cyber

Thank you for your interest in contributing to Aegis Cyber!

---

## Development Setup

Follow the [Installation & Setup](README.md#7-installation--setup) section in the README to get the full stack running locally.

### Minimum Requirements
- Node.js 18+
- Python 3.9+
- Git

---

## Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/VAST-CSE/2023-27-MAIN-C8-YADUKRISHNAN-NK.git
cd 2023-27-MAIN-C8-YADUKRISHNAN-NK
git checkout -b feature/your-feature-name
```

### 2. Install Dependencies

```bash
# Root
npm install

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# AI Engine
cd ai_engine && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && cd ..

# Blockchain
cd blockchain && npm install && cd ..
```

### 3. Start Development Servers

```bash
# Terminal 1 — Hardhat EVM
cd blockchain && npm run node

# Terminal 2 — AI Engine
cd ai_engine && venv\Scripts\activate && python app/main.py

# Terminal 3 — Backend + Frontend
npm run dev
```

---

## Code Standards

### TypeScript (Backend & Frontend)
- Use TypeScript strict mode
- Prefer `async/await` over raw Promises
- Use named exports (avoid default where not necessary)
- Add JSDoc comments on public functions and service methods
- Run `npx tsc --noEmit` before committing

### Python (AI Engine)
- Follow PEP 8 style
- Use type hints on all function signatures
- Document each route with FastAPI docstring descriptions

### Solidity (Blockchain)
- Follow the existing NatSpec comment style
- Every public function must have `@notice` and `@param` documentation
- Run `npm run compile` to verify no compilation errors

---

## Testing Requirements

All pull requests must include relevant tests and must not break existing ones.

### Run Tests

```bash
# Backend unit tests
cd backend && npm test

# Blockchain contract tests
cd blockchain && npm test

# E2E Playwright tests (requires full stack)
npm run test:e2e

# Type checks
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

## Security Guidelines

- **Never** commit `.env` files, API keys, private keys, or passwords.
- **Never** log sensitive data (tokens, passwords, PII) to console.
- All new API routes must be protected by `authenticateJWT` and `zeroTrustGuard` unless explicitly a public endpoint.
- New file handling code must route through the AI scanner before storage.
- Audit logs must be created for all security-relevant events.

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `security`

**Examples:**
```
feat(backend): add TOTP second-factor authentication
fix(frontend): resolve vault download decryption error on large files
docs(readme): update blockchain deployment instructions
security(middleware): restrict CORS to production domain
```

---

## Pull Request Checklist

- [ ] Code compiles without TypeScript errors
- [ ] Existing tests pass
- [ ] New tests added for new functionality
- [ ] `.env.example` updated if new environment variables added
- [ ] Documentation updated in README.md or docs/ if applicable
- [ ] No secrets, credentials, or `.env` files committed
- [ ] Commit messages follow conventional format
- [ ] PR description explains what and why

---

## Project Structure

See [README.md — Directory Structure](README.md#5-project-directory-structure) for the full layout.

Key areas:
- `backend/src/controllers/` — Add new API handlers here
- `backend/src/routes/api.ts` — Register new routes here
- `backend/src/middleware/` — Security middleware
- `frontend/src/pages/` — Add new React pages here
- `ai_engine/app/routers/` — Add new AI API endpoints here
- `blockchain/contracts/` — Solidity smart contracts

---

## Reporting Issues

Open a GitHub Issue with:
1. Clear title describing the bug or request
2. Steps to reproduce (for bugs)
3. Expected vs actual behavior
4. Environment details (OS, Node version, Python version)
5. Relevant logs or error messages

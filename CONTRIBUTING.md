# Contributing to Garden of Eden V3

Thank you for your interest in contributing to Garden of Eden V3! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or intimidation
- Trolling, insulting comments, or personal attacks
- Publishing others' private information
- Any conduct that could be considered inappropriate in a professional setting

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 20+ (LTS recommended, <25.0.0)
- **Python** 3.10+ (for AI model bindings)
- **CMake** 3.20+ (for native module compilation)
- **Git** for version control
- **macOS** 12+ or **Windows** 10/11
- **~15GB RAM** for development
- **~12GB disk space** for AI models

### First-Time Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Garden_of_Eden_V3.git
   cd Garden_of_Eden_V3
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/wannahappyaroundme/Garden_of_Eden_V3.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

4. **Build native modules**
   ```bash
   npm run build:native
   ```

5. **Download AI models** (optional for UI work)
   ```bash
   npm run download:models
   ```

6. **Run development mode**
   ```bash
   npm run dev
   ```

---

## Development Setup

### Recommended IDE

- **Visual Studio Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - GitLens

### Environment Variables

Create a `.env` file in the project root (optional):

```env
# Development mode
NODE_ENV=development

# Model paths (defaults to ~/Library/Application Support/garden-of-eden-v3/models)
MODELS_DIR=/path/to/models

# Logging level
LOG_LEVEL=info

# ChromaDB URL (optional, defaults to http://localhost:8000)
CHROMA_DB_URL=http://localhost:8000
```

### Running the Project

```bash
# Start full app in development mode
npm run dev

# Run main process only
npm run dev:main

# Run renderer only
npm run dev:renderer

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Run tests
npm test
npm run test:watch
```

---

## Project Structure

```
garden-of-eden-v3/
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   ├── index.ts       # Entry point
│   │   ├── window.ts      # Window management
│   │   ├── ipc/           # IPC handlers (add new handlers here)
│   │   ├── services/      # Core services (AI, integrations)
│   │   └── database/      # SQLite database layer
│   │
│   ├── renderer/          # React UI (sandboxed)
│   │   ├── App.tsx        # Root component
│   │   ├── pages/         # Main pages (Chat, Settings)
│   │   ├── components/    # Reusable components
│   │   ├── stores/        # Zustand state management
│   │   └── i18n/          # Translations (ko, en)
│   │
│   ├── preload/           # Secure IPC bridge
│   │   └── index.ts       # Expose APIs to renderer
│   │
│   └── shared/            # Shared types/constants
│       ├── types/         # TypeScript interfaces
│       └── constants/     # App-wide constants
│
├── tests/                 # Unit, integration, E2E tests
├── scripts/               # Build & utility scripts
├── docs/                  # Additional documentation
└── resources/             # Icons, models, assets
```

### Key Files

- **src/main/index.ts** - Main process entry point, registers IPC handlers
- **src/preload/index.ts** - Secure IPC bridge, exposes APIs to renderer
- **src/renderer/App.tsx** - React root component
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite configuration for renderer
- **jest.config.js** - Jest testing configuration

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create a new branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clear, self-documenting code
- Add comments for complex logic
- Follow the coding standards (see below)
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Test the app manually
npm run dev
```

### 4. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: Add amazing new feature"
```

See [Commit Guidelines](#commit-guidelines) below for details.

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### TypeScript

- **Use strict mode** - No implicit `any`, strict null checks
- **Prefer interfaces** over types for object shapes
- **Use meaningful names** - Prefer clarity over brevity
- **No `any` types** - Use `unknown` if necessary, then type guard
- **Document public APIs** - Add JSDoc comments for exported functions

Example:

```typescript
/**
 * Downloads a model from a URL
 * @param modelId - The ID of the model to download
 * @returns Promise<void>
 * @throws {Error} If download fails
 */
async downloadModel(modelId: string): Promise<void> {
  // Implementation
}
```

### React Components

- **Use functional components** with hooks
- **Use TypeScript for props** - Define prop interfaces
- **Use Tailwind CSS** for styling
- **Avoid inline styles** unless necessary
- **Extract reusable logic** into custom hooks

Example:

```typescript
interface ChatBubbleProps {
  message: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function ChatBubble({ message, role, timestamp }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble ${role}`}>
      {/* Component JSX */}
    </div>
  );
}
```

### File Organization

- **One component per file** - Export as default or named export
- **Group related files** in folders (e.g., `components/chat/`)
- **Use index files** for clean imports
- **Colocate tests** with source files (e.g., `Button.test.tsx`)

### Naming Conventions

- **Files**: `kebab-case.ts`, `PascalCase.tsx` for React components
- **Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Classes**: `PascalCase`
- **Interfaces**: `PascalCase` (no `I` prefix)
- **Types**: `PascalCase`

---

## Testing Guidelines

### Test Structure

```typescript
describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should do something successfully', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = service.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle errors gracefully', () => {
      expect(() => service.methodName('')).toThrow('Error message');
    });
  });
});
```

### Test Coverage

- **Target: 80%** code coverage
- **Unit tests** for all services and utilities
- **Integration tests** for IPC communication
- **E2E tests** for critical user flows

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- tests/unit/services/llama.service.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Commit Guidelines

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code formatting (no logic changes)
- **refactor**: Code restructuring (no feature or bug changes)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
feat(chat): Add streaming response support

Implemented token-by-token streaming for AI responses using
node-llama-cpp streaming API. Added typing indicator and
smooth token appending to chat bubbles.

Closes #123
```

```bash
fix(download): Resolve resume capability for large models

Fixed issue where download resume would restart from 0% instead
of continuing from last byte position. Added proper Range header
support and temp file handling.

Fixes #456
```

```bash
docs: Update README with Phase 7 completion status

- Added auto-updater documentation
- Updated installation instructions
- Added model downloader usage guide
```

### Commit Message Rules

- Use imperative mood ("Add feature" not "Added feature")
- First line max 72 characters
- Reference issues/PRs in footer (Closes #123, Fixes #456)
- Add breaking changes with `BREAKING CHANGE:` footer
- Add co-authors with `Co-Authored-By: Name <email>`

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest main
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run type-check
   npm run lint
   npm test
   ```

3. **Test manually** in development mode
   ```bash
   npm run dev
   ```

### PR Title Format

Use the same format as commit messages:

```
feat(chat): Add markdown rendering support
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Motivation and Context
Why is this change needed? What problem does it solve?

## Changes Made
- Change 1
- Change 2
- Change 3

## Screenshots (if applicable)
Add screenshots for UI changes

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing on macOS
- [ ] Manual testing on Windows

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
```

### Review Process

1. **Automated checks** must pass (linting, tests, type-check)
2. **At least one approval** required from maintainers
3. **Address review comments** promptly
4. **Squash commits** if requested
5. **Rebase on main** before merge

### Merge Strategy

- **Squash and merge** for feature branches
- **Rebase and merge** for hotfixes
- **Merge commit** for release branches

---

## Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Try the latest version** - Bug might be fixed
3. **Gather information**:
   - OS version (macOS 12+, Windows 10/11)
   - App version (Help → About)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots or logs

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should have happened.

**Screenshots**
Add screenshots if applicable.

**Environment**
- OS: [macOS 12.0 / Windows 11]
- Version: [1.0.0-beta]
- Model: [Llama 3.1 8B / LLaVA 7B]

**Additional context**
Any other relevant information.

**Logs**
```
Paste logs from ~/Library/Application Support/garden-of-eden-v3/logs/
```
```

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Describe the problem or limitation.

**Describe the solution you'd like**
Clear description of desired functionality.

**Describe alternatives you've considered**
Other approaches you've thought about.

**Additional context**
Screenshots, mockups, or examples.

**Would you like to implement this?**
- [ ] Yes, I'd like to submit a PR
- [ ] No, but I can help test
- [ ] Just suggesting the idea
```

---

## Community

### Getting Help

- **GitHub Discussions**: [Q&A and community discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
- **GitHub Issues**: [Bug reports and feature requests](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/issues)
- **Documentation**: [Project specs and guides](docs/)

### Communication Channels

- **GitHub Discussions** - General questions and community chat
- **GitHub Issues** - Bug reports and feature requests
- **Pull Requests** - Code review and collaboration
- **Discord** (coming soon) - Real-time chat and support

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in commit messages (Co-Authored-By)
- Thanked in project README

---

## Development Tips

### Debugging

- **Main Process**: VSCode debugger attached to Electron main
- **Renderer Process**: Open DevTools (Cmd+Option+I / Ctrl+Shift+I)
- **Logs**: `~/Library/Application Support/garden-of-eden-v3/logs/`

### Performance Profiling

```typescript
// Use React DevTools Profiler
<React.Profiler id="Chat" onRender={onRender}>
  <Chat />
</React.Profiler>

// Use Chrome DevTools Performance tab in renderer
```

### IPC Communication

When adding new IPC channels:

1. Define types in `src/shared/types/ipc.types.ts`
2. Create handler in `src/main/ipc/[feature].handler.ts`
3. Register in `src/main/index.ts`
4. Expose in `src/preload/index.ts`
5. Use in renderer via `window.api.[method]`

### Database Migrations

```bash
# Create migration
npm run migrate:create migration-name

# Run migrations
npm run migrate:up

# Rollback
npm run migrate:down
```

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have questions about contributing, feel free to:

1. Check existing [GitHub Discussions](https://github.com/wannahappyaroundme/Garden_of_Eden_V3/discussions)
2. Open a new discussion for clarification
3. Reach out to maintainers in pull request comments

Thank you for contributing to Garden of Eden V3! 💚

---

**Last Updated**: 2025-01-13
**Version**: 1.0.0-beta

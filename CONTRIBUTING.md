# Contributing to Minutas

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

---

## Getting Started

Thank you for contributing to Minutas! This document provides guidelines for contributing to the project.

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

---

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Minutas.git
   cd Minutas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to http://localhost:3000

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── report/      # Report-specific components
│   └── ...
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── types/           # TypeScript type definitions
└── constants/       # Shared constants
```

### Key Directories

- **`app/`**: Next.js pages using App Router
- **`components/`**: Reusable React components
- **`hooks/`**: Custom hooks for data management and UI logic
- **`lib/`**: Utility functions and helpers
- **`types/`**: TypeScript interfaces and types

---

## Code Style

### TypeScript

- **Always use TypeScript** - No JavaScript files
- **Enable strict mode** - All `tsconfig.json` strict options enabled
- **Avoid `any`** - Use proper types or `unknown` with type guards
- **Export types** - Make interfaces reusable

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

### React Components

- **Functional components only** - No class components
- **Use hooks** - Prefer hooks over HOCs
- **TypeScript props** - Always define prop interfaces

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Custom Hooks

- **Prefix with `use`** - Follow React conventions
- **Single responsibility** - One hook, one purpose
- **Type the return value** - Explicit return types

```typescript
// ✅ Good
export function usePersonnel() {
  const [personnel, setPersonnel] = useState<StaffMember[]>([]);
  // ...
  return { personnel, addMember, removeMember, isLoaded };
}
```

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `PersonnelTable.tsx`)
- **Hooks**: `kebab-case.ts` (e.g., `use-personnel.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Types**: `index.ts` in `types/` directory

---

## Git Workflow

### Branch Naming

- **Feature**: `feature/description` (e.g., `feature/add-personnel-search`)
- **Fix**: `fix/description` (e.g., `fix/attendance-date-bug`)
- **Refactor**: `refactor/description` (e.g., `refactor/personal-page`)
- **Docs**: `docs/description` (e.g., `docs/update-readme`)

### Commit Messages

Follow Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, etc.

**Examples**:
```bash
feat(personnel): add search functionality
fix(guards): correct staff assignment bug
refactor(hooks): migrate to useLocalStorage
docs(readme): update installation instructions
```

### Commit Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(component): add new feature"
   ```

3. **Push to remote**
   ```bash
   git push origin feature/my-feature
   ```

4. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill in the PR template
   - Request review

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests in UI mode
npm run test:ui
```

### Writing Tests

- **Test files**: Place `*.test.ts(x)` next to source files
- **Name tests clearly**: Describe what is being tested
- **Follow AAA pattern**: Arrange, Act, Assert

```typescript
// use-personnel.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePersonnel } from './use-personnel';

describe('usePersonnel', () => {
  it('should add a new member', () => {
    const { result } = renderHook(() => usePersonnel());
    
    act(() => {
      result.current.addMember({ name: 'Test User', cedula: '123' });
    });
    
    expect(result.current.personnel).toHaveLength(1);
    expect(result.current.personnel[0].name).toBe('Test User');
  });
});
```

---

## Pull Request Process

### Before Submitting

1. ✅ **Run type check**: `npm run typecheck`
2. ✅ **Run linter**: `npm run lint`
3. ✅ **Run tests**: `npm test` (when available)
4. ✅ **Test manually**: Verify changes work in browser
5. ✅ **Update documentation**: If needed

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Tested manually
- [ ] Added/updated tests
- [ ] All tests passing

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console warnings/errors
```

### Review Process

- At least one approval required
- All comments must be resolved
- CI/CD must pass (when configured)
- Squash commits before merging

---

## Code Review Guidelines

### As a Reviewer

- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve if code improves the codebase
- Block if there are serious issues

### As an Author

- Respond to all comments
- Don't take criticism personally
- Explain your reasoning
- Make requested changes promptly

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## Questions?

If you have questions, please:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label

---

**Thank you for contributing!** 🎉

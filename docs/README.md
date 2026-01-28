# 📚 Documentation Guide

Welcome to the Minutas project documentation! This guide will help you navigate and contribute to the project.

---

## 🗂️ Documentation Structure

```
docs/
├── architecture.md          # System architecture & diagrams
├── template_engine.md      # Template engine & syntax guide
├── api/                     # Auto-generated API docs (TypeDoc)
│   └── [generated files]
└── README.md               # This file
```

---

## 📖 Available Documentation

### 1. **Architecture Documentation** 

**File**: [`architecture.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/architecture.md)

Comprehensive overview of the system architecture, including:
- System architecture diagrams
- Component relationships
- Data flow diagrams
- Template processing flow
- Module organization
- Database schema

**When to use**: Understanding the overall system design, onboarding new developers, planning major features.

---

### 2. **Template Engine & Syntax** 

**File**: [`template_engine.md`](template_engine.md)

Detailed guide on the template system, including:
- Processing pipeline (Lexer, Parser, etc.)
- Tag syntax (fields, types, modifiers)
- Section & Repeatable block logic
- Conditional expressions and operators

**When to use**: Creating new report templates, debugging rendering issues, extending the template engine.

---

### 3. **API Documentation** (Auto-generated)

**Location**: `docs/api/` (generated)

Automatically generated API documentation from TypeScript source code using TypeDoc.

**How to generate**:
```bash
npm run docs:generate
```

**Coverage**:
- All exported functions from `src/lib/`
- Custom hooks from `src/hooks/`
- Type definitions from `src/types/`

**When to use**: Looking up function signatures, understanding parameters, checking return types.

---

### 3. **Testing Documentation**

**Files**:
- [`pure_function_testing_plan.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/pure_function_testing_plan.md) - Testing strategy
- [`testing_session_walkthrough.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/testing_session_walkthrough.md) - Testing progress summary

**Coverage**:
- Testing approach and philosophy
- Test organization
- Mock data factories
- Current test coverage (173 tests)

**When to use**: Writing new tests, understanding test patterns, checking test coverage.

---

### 4. **Implementation Plans**

**Files**:
- [`implementation_plan.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/implementation_plan.md) - Master implementation roadmap
- [`task.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/task.md) - Current tasks and progress

**Coverage**:
- Project roadmap
- Current priorities
- Completed work
- Next steps

**When to use**: Planning work, checking project status, understanding priorities.

---

## ✍️ Writing JSDoc Comments

### Best Practices

All exported functions should have JSDoc comments. Follow this template:

```typescript
/**
 * Brief description of what the function does (single line)
 * 
 * More detailed explanation if needed (multi-line).
 * Can include examples, edge cases, etc.
 * 
 * @param paramName - Description of param
 * @param optionalParam - Description of optional param (optional indicated by ?)
 * @returns Description of what is returned
 * 
 * @example
 * ```typescript
 * const result = functionName('example', true);
 * console.log(result); // 'Expected output'
 * ```
 * 
 * @throws {ErrorType} When this error might occur
 * @see relatedFunction - For related functionality
 */
export function functionName(paramName: string, optionalParam?: boolean): string {
  // Implementation
}
```

### Example: formatStaffMember

```typescript
/**
 * Formats a staff member for display in templates and reports
 * 
 * Generates a formatted string representation of a staff member,
 * optionally including their cedula (ID number) in parentheses.
 * 
 * @param member - The staff member to format
 * @param showCedula - Whether to include the cedula in the output (default: false)
 * @returns Formatted string (e.g., "Juan Pérez" or "Juan Pérez (12345678)")
 * 
 * @example
 * ```typescript
 * const member = { name: 'Juan Pérez', cedula: '12345678', ...};
 * 
 * formatStaffMember(member);           // "Juan Pérez"
 * formatStaffMember(member, true);     // "Juan Pérez (12345678)"
 * formatStaffMember(member, false);    // "Juan Pérez"
 * ```
 * 
 * @see formatStaffMemberForDisplay
 * @see formatStaffMemberForAutocomplete
 */
export function formatStaffMember(
  member: StaffMember, 
  showCedula: boolean = false
): string {
  if (!member) return '';
  
  if (showCedula && member.cedula) {
    return `${member.name} (${member.cedula})`;
  }
  
  return member.name;
}
```

### JSDoc Tags Reference

| Tag | Purpose | Example |
|-----|---------|---------|
| `@param` | Document parameters | `@param name - User's name` |
| `@returns` | Document return value | `@returns Formatted string` |
| `@throws` | Document exceptions | `@throws {Error} If invalid` |
| `@example` | Provide usage example | See above |
| `@see` | Link to related code | `@see otherFunction` |
| `@deprecated` | Mark as deprecated | `@deprecated Use newFunc instead` |
| `@since` | Version introduced | `@since 0.1.0` |
| `@internal` | Hide from docs | `@internal` |

---

## 🔨 Generating Documentation

### Generate API Docs

```bash
# Generate TypeDoc documentation
npm run docs:generate

# Output will be in docs/api/
```

### View Generated Docs

Open `docs/api/index.html` in your browser (when using HTML output) or browse the markdown files.

---

## 📝 Documentation Maintenance

### When to Update Documentation

- ✅ **Architecture changes**: Update `architecture.md`
- ✅ **New features**: Add JSDoc comments
- ✅ **API changes**: Update function JSDoc
- ✅ **Breaking changes**: Document in CHANGELOG (when created)
- ✅ **Implementation complete**: Update `task.md`

### Documentation Checklist

Before committing code:

- [ ] Added/updated JSDoc comments for new/modified functions
- [ ] Updated architecture diagrams if structure changed
- [ ] Added tests for new functionality
- [ ] Updated task.md progress
- [ ] Ran `npm run docs:generate` to verify no TypeDoc errors

---

## 🎯 Quick Reference

### Common Documentation Tasks

```bash
# Generate API documentation
npm run docs:generate

# Run tests
npm test

# Type check
npm run typecheck

# Format code
npm run format

# Lint code
npm run lint:fix
```

### File Locations

- **Source code**: `src/`
- **Tests**: `src/**/__tests__/`
- **Architecture docs**: `brain/architecture.md`
- **Generated API docs**: `docs/api/`
- **Task tracking**: `brain/task.md`

---

## 🤝 Contributing to Documentation

### Adding New Module Documentation

1. Add JSDoc comments to all exported functions
2. Include at least one `@example` for complex functions
3. Document all parameters and return types
4. Link to related functions with `@see`
5. Run `npm run docs:generate` to verify

### Creating New Diagrams

Use Mermaid syntax in markdown files:

```markdown
\u0060\u0060\u0060mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\u0060\u0060\u0060
```

### Updating Architecture Docs

Edit `architecture.md` and ensure:
- Diagrams are up-to-date
- Module descriptions reflect current code
- Examples are accurate
- Links to related docs work

---

## 📊 Current Documentation Status

| Area | Status | Coverage |
|------|--------|----------|
| Architecture Diagrams | ✅ Complete | 6 diagrams |
| TypeDoc Setup | ✅ Complete | Configured |
| JSDoc Comments | ⚠️ Partial | ~40% |
| Testing Docs | ✅ Complete | 100% |
| Contribution Guide | ❌ TODO | 0% |
| Deployment Guide | ❌ TODO | 0% |

---

## 🎓 Learning Resources

### Internal Resources

- Template Parser Refactoring: [`walkthrough.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/walkthrough.md)
- Testing Strategy: [`pure_function_testing_plan.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/pure_function_testing_plan.md)
- Sentry Setup: [`sentry_setup_guide.md`](../C:/Users/Dark/.gemini/antigravity/brain/f1402065-7a63-4657-b068-5cf74a1a5e01/sentry_setup_guide.md)

### External Resources

- [TypeDoc Documentation](https://typedoc.org/)
- [JSDoc Reference](https://jsdoc.app/)
- [Mermaid Diagram Syntax](https://mermaid.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [RxDB Documentation](https://rxdb.info/)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-27 | Initial documentation structure |

---

**Maintained by**: Development Team  
**Last Updated**: January 27, 2026

---
description: "File and directory structure, component organization, and file naming conventions"
alwaysApply: true
---

# File Organization Rules

## Directory Structure

**Mobile App (`app/`):**
- Use Expo Router file-based routing
- Group related screens in directories
- Use `(tabs)` for tab navigation
- Use `_layout.tsx` for layout wrappers

**Web ERP (`web/app/`):**
- Use Next.js App Router conventions
- One page per directory with `page.tsx`
- Use route groups for organization

**Components:**
- Shared components in root `components/`
- Web-specific components in `web/components/`
- Group related components in subdirectories

**Services:**
- Mobile services in `lib/` (e.g., `supabase-kds.ts`)
- Web services in `web/lib/` (e.g., `supabase-services.ts`)
- Shared utilities in `shared/`

## File Naming

**Rules:**
- One component per file
- File name must match component name (converted to kebab-case)
- Use descriptive names, not abbreviations
- Index files only for barrel exports

**Examples:**
```typescript
// ✅ GOOD: event-form.tsx
export function EventForm() { }

// ✅ GOOD: client-list.tsx
export function ClientList() { }

// ❌ BAD: form.tsx, ef.tsx, Event.tsx
```

## File Structure

**Component Files:**
1. Imports (external → internal → relative → types)
2. Type definitions (interfaces, types)
3. Component code
4. Exports

**Service Files:**
1. Imports
2. Type definitions
3. Service functions
4. Exports

## Adding New Files

When adding new files:
- Follow existing directory structure
- Use proper naming conventions (kebab-case)
- Place in appropriate directory
- Update relevant index files if needed

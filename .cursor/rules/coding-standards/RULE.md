---
description: "CaterKing coding standards: TypeScript, React, naming conventions, file organization, and code style rules"
alwaysApply: true
---

# CaterKing Coding Standards

When writing code for CaterKing Operations Companion, follow these standards:

## TypeScript Rules

- **Strict Mode:** Always enabled - no `any` types allowed
- **Type Everything:** All functions, variables, and parameters must have explicit types
- **Use Interfaces:** Prefer `interface` over `type` for object shapes
- **Export Types:** Export types and interfaces alongside code

```typescript
// ✅ GOOD
interface EventData {
  id: string;
  name: string;
  guest_count: number;
}

function getEvent(id: string): Promise<EventData | null> {
  // implementation
}
```

## React/React Native Rules

- **Functional Components:** Always use functional components with hooks
- **Hooks Order:** Follow rules of hooks - hooks must be called in same order
- **Memoization:** Use `useMemo` and `useCallback` for expensive computations
- **Props Destructuring:** Destructure props at function signature

```typescript
// ✅ GOOD
function EventCard({ event, onPress }: EventCardProps) {
  const formattedDate = useMemo(() => formatDate(event.event_date), [event.event_date]);
  
  const handlePress = useCallback(() => {
    onPress(event.id);
  }, [event.id, onPress]);
  
  return <Pressable onPress={handlePress}>...</Pressable>;
}
```

## Import Organization

1. External libraries (React, Expo, etc.)
2. Internal libraries (`@/lib`, `@/components`)
3. Shared types (`@shared/types`)
4. Relative imports (`./component`)
5. Types-only imports last (`import type { ... }`)

## Formatting

- Use Prettier for auto-formatting (run `pnpm format`)
- Use ESLint for linting (run `pnpm lint`)
- Trailing commas in multi-line objects/arrays
- Semicolons always required
- Single quotes for strings, double quotes for JSX attributes
- Max line length: 100 characters (soft limit)

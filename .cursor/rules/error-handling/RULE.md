---
description: "Error handling patterns, user-facing errors, validation, and error boundaries"
alwaysApply: true
---

# Error Handling Rules

## General Rules

**Always:**
1. **Handle errors** - never silently fail
2. **Log errors** with context for debugging
3. **Show user-friendly messages** to users
4. **Use try/catch** for async operations
5. **Validate inputs** before processing

```typescript
// ✅ GOOD
async function createEvent(data: EventData) {
  try {
    // Validate input
    if (!data.event_name) {
      throw new Error('Event name is required');
    }
    
    const result = await supabase
      .from('events')
      .insert([data])
      .select()
      .single();
    
    if (result.error) {
      throw result.error;
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to create event:', error);
    throw error; // Re-throw for caller to handle
  }
}
```

## Error Display

**Rules:**
1. **User-facing errors:** Clear, actionable messages
2. **Developer errors:** Log full error details to console
3. **Error boundaries:** Use React error boundaries for component errors
4. **Network errors:** Handle offline/connection issues gracefully

```typescript
// ✅ GOOD
function EventForm() {
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (data: EventData) => {
    try {
      await createEvent(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error 
        ? err.message 
        : 'Failed to create event. Please try again.';
      setError(message);
    }
  };
  
  return (
    <>
      {error && <Text className="text-red-500">{error}</Text>}
      {/* form */}
    </>
  );
}
```

## Validation

**Always validate:**
- User input before database operations
- API responses before using data
- Environment variables on startup
- Required fields before submission

Use Zod schemas for validation:

```typescript
// ✅ GOOD
import { z } from 'zod';

const eventSchema = z.object({
  event_name: z.string().min(1, 'Event name is required'),
  event_date: z.string().date('Invalid date format'),
  guest_count: z.number().int().positive('Guest count must be positive'),
});

// Validate before use
const result = eventSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

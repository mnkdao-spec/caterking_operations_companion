# CaterKing Sprint Task Breakdown
## Detailed Task List for Team Coordination

**Document Version**: 1.0  
**Created**: February 3, 2026  
**Team**: 1-2 developers  
**Total Tasks**: 68 issues across 4 sprints

---

## Sprint 1: Critical Blockers & Fixes (Weeks 1-2)
**Goal**: Fix production blockers and data integrity issues  
**Effort**: 37 hours  
**Team**: 1 senior developer

### Sprint 1A: KDS UI Integration (CRITICAL)

#### Task 1.A.1: Analyze Current KDS UI Implementation
- **Description**: Document current mock data usage in KDS screens
- **Acceptance Criteria**:
  - [ ] Identify all mock data in expo.tsx
  - [ ] Identify all mock data in station.tsx
  - [ ] Identify all mock data in plating.tsx
  - [ ] Document data structures needed from context
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: None
- **Related Files**:
  - `app/kds/expo.tsx`
  - `app/kds/station.tsx`
  - `app/kds/plating.tsx`

#### Task 1.A.2: Connect Expo Screen to useKDSInventory()
- **Description**: Replace mock courses with real data from context
- **Acceptance Criteria**:
  - [ ] Import useKDSInventory hook
  - [ ] Replace mockCourses with real courses from context
  - [ ] Replace mockTableGroups with real tableGroups
  - [ ] Replace mockFiredCourses with real firedCourses
  - [ ] Remove all mock data constants
  - [ ] Add loading state while fetching
  - [ ] Test with real event data
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 1.A.1
- **Related Files**:
  - `app/kds/expo.tsx`
  - `lib/kds-context-with-inventory.tsx`

#### Task 1.A.3: Connect Station Screen to Real Context
- **Description**: Replace mock items with real order items from context
- **Acceptance Criteria**:
  - [ ] Import useKDSInventory hook
  - [ ] Replace mockItems with real items from context
  - [ ] Replace mockOrders with real orders
  - [ ] Implement proper grouping by fired course
  - [ ] Add loading state
  - [ ] Test bump functionality
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 1.A.1
- **Related Files**:
  - `app/kds/station.tsx`
  - `lib/kds-context-with-inventory.tsx`

#### Task 1.A.4: Connect Plating Screen to Real Context
- **Description**: Replace mock courses with real completion status
- **Acceptance Criteria**:
  - [ ] Import useKDSInventory hook
  - [ ] Replace mockCourses with real courses
  - [ ] Show real completion status
  - [ ] Add loading state
  - [ ] Test with real event data
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 1.A.1
- **Related Files**:
  - `app/kds/plating.tsx`
  - `lib/kds-context-with-inventory.tsx`

#### Task 1.A.5: Add Loading States to KDS Screens
- **Description**: Implement LoadingSpinner during data fetch
- **Acceptance Criteria**:
  - [ ] Import LoadingSpinner component
  - [ ] Show spinner while loading is true
  - [ ] Show content when loading is false
  - [ ] Handle loading state on all 3 screens
  - [ ] Test loading transitions
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 1.A.2, 1.A.3, 1.A.4
- **Related Files**:
  - `shared/components/LoadingSpinner.tsx`
  - `app/kds/expo.tsx`
  - `app/kds/station.tsx`
  - `app/kds/plating.tsx`

#### Task 1.A.6: Add Error Handling to KDS Screens
- **Description**: Implement ErrorDisplay with retry functionality
- **Acceptance Criteria**:
  - [ ] Import ErrorDisplay component
  - [ ] Show error message if context returns error
  - [ ] Implement retry button
  - [ ] Handle errors on all 3 screens
  - [ ] Test error scenarios
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 1.A.2, 1.A.3, 1.A.4
- **Related Files**:
  - `shared/components/ErrorDisplay.tsx`
  - `app/kds/expo.tsx`
  - `app/kds/station.tsx`
  - `app/kds/plating.tsx`

#### Task 1.A.7: End-to-End KDS Workflow Test
- **Description**: Test complete KDS workflow with real data
- **Acceptance Criteria**:
  - [ ] Create test event in Supabase
  - [ ] Add courses and table groups
  - [ ] Fire courses from expo screen
  - [ ] Verify appearance on station screens
  - [ ] Bump items and verify inventory decrements
  - [ ] Test all 3 screens together
  - [ ] Document test results
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 1.A.5, 1.A.6
- **Related Files**:
  - All KDS screens
  - `lib/kds-context-with-inventory.tsx`

**Subtotal Sprint 1A**: 12.5 hours

---

### Sprint 1B: Inventory Rollback Fix (CRITICAL)

#### Task 1.B.1: Analyze Current Inventory Flow
- **Description**: Document current bumpItemWithInventory() implementation
- **Acceptance Criteria**:
  - [ ] Identify current operation order
  - [ ] Document failure scenarios
  - [ ] Identify data inconsistency risks
  - [ ] Create flowchart of current process
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: None
- **Related Files**:
  - `lib/kds-context-with-inventory.tsx`
  - `lib/supabase-inventory.ts`

#### Task 1.B.2: Implement Reverse Operation Order
- **Description**: Decrement inventory before marking order as done
- **Acceptance Criteria**:
  - [ ] Call decrementInventoryForOrderItem() first
  - [ ] Only bump item if decrement succeeds
  - [ ] Throw error if decrement fails
  - [ ] Add comprehensive error message
  - [ ] Update bumpItemWithInventory() function
  - [ ] Test success path
  - [ ] Test failure path
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 1.B.1
- **Related Files**:
  - `lib/kds-context-with-inventory.tsx`
  - `lib/supabase-inventory.ts`

#### Task 1.B.3: Add Comprehensive Error Handling
- **Description**: Ensure both operations rolled back on any failure
- **Acceptance Criteria**:
  - [ ] Catch all error types
  - [ ] Log error details
  - [ ] Show user-friendly error message
  - [ ] Provide recovery options
  - [ ] Test network error scenario
  - [ ] Test database error scenario
  - [ ] Test validation error scenario
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 1.B.2
- **Related Files**:
  - `lib/kds-context-with-inventory.tsx`
  - `shared/components/ErrorDisplay.tsx`

#### Task 1.B.4: Write Rollback Test Cases
- **Description**: Create test suite for inventory rollback scenarios
- **Acceptance Criteria**:
  - [ ] Test successful bump + decrement
  - [ ] Test decrement failure → no bump
  - [ ] Test bump failure → rollback decrement (if applicable)
  - [ ] Test network error handling
  - [ ] Test database error handling
  - [ ] Test concurrent operations
  - [ ] All tests passing
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 1.B.3
- **Related Files**:
  - `web/__tests__/inventory-rollback.test.ts` (new)

**Subtotal Sprint 1B**: 8 hours

---

### Sprint 1C: N+1 Query Fix (PERFORMANCE)

#### Task 1.C.1: Profile Current KDS Queries
- **Description**: Identify N+1 query pattern in KDS context
- **Acceptance Criteria**:
  - [ ] Enable query logging in Supabase
  - [ ] Load event with multiple fired courses
  - [ ] Count total queries executed
  - [ ] Identify per-course queries
  - [ ] Document current query count
  - [ ] Measure current query time
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None
- **Related Files**:
  - `lib/kds-context-realtime.tsx`
  - `lib/kds-context-with-inventory.tsx`

#### Task 1.C.2: Implement Batch Query for Order Items
- **Description**: Load all order items in single query instead of per-course
- **Acceptance Criteria**:
  - [ ] Replace per-course queries with single batch query
  - [ ] Use .in() filter for all fired course IDs
  - [ ] Load all items at once
  - [ ] Update context to use batch data
  - [ ] Verify data structure unchanged
  - [ ] Test with multiple courses
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 1.C.1
- **Related Files**:
  - `lib/kds-context-realtime.tsx`
  - `lib/kds-context-with-inventory.tsx`

#### Task 1.C.3: Implement Client-Side Grouping
- **Description**: Group items by fired course after batch fetch
- **Acceptance Criteria**:
  - [ ] Create grouping function
  - [ ] Group items by fired_course_id
  - [ ] Maintain order and structure
  - [ ] Test grouping logic
  - [ ] Verify UI displays correctly
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 1.C.2
- **Related Files**:
  - `lib/kds-context-realtime.tsx`

#### Task 1.C.4: Performance Benchmark
- **Description**: Measure query performance improvement
- **Acceptance Criteria**:
  - [ ] Measure query time before optimization
  - [ ] Measure query time after optimization
  - [ ] Calculate improvement percentage
  - [ ] Document results
  - [ ] Verify ≥50% improvement
  - [ ] Test with 10+ courses
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 1.C.3
- **Related Files**:
  - Performance test script

**Subtotal Sprint 1C**: 5.5 hours

---

### Sprint 1 Summary
- **Total Tasks**: 16
- **Total Effort**: 26 hours (plus 8 hours testing/documentation)
- **Critical Tasks**: 7
- **High Priority**: 9
- **Owner**: Dev1 (single developer)

---

## Sprint 2: Authentication & Security (Weeks 3-4)
**Goal**: Unify authentication systems and implement security best practices  
**Effort**: 40 hours  
**Team**: 1 senior developer

### Sprint 2A: Unify Dual Authentication Systems

#### Task 2.A.1: Design Unified Auth Flow
- **Description**: Document integration points between Manus OAuth and Supabase Auth
- **Acceptance Criteria**:
  - [ ] Document current Manus OAuth flow
  - [ ] Document current Supabase Auth flow
  - [ ] Identify integration points
  - [ ] Design unified flow diagram
  - [ ] Document token exchange process
  - [ ] Create implementation plan
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: None

#### Task 2.A.2: Update Backend OAuth Endpoint
- **Description**: Return both Manus and Supabase tokens from login
- **Acceptance Criteria**:
  - [ ] Modify /api/auth/login endpoint
  - [ ] Generate Supabase token on Manus login
  - [ ] Return both tokens in response
  - [ ] Include token expiration times
  - [ ] Test endpoint returns correct format
  - [ ] Document response structure
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 2.A.1

#### Task 2.A.3: Update use-auth.ts Hook
- **Description**: Integrate hook with Supabase session
- **Acceptance Criteria**:
  - [ ] Import Supabase auth context
  - [ ] Store both Manus and Supabase tokens
  - [ ] Sync session state
  - [ ] Handle token refresh
  - [ ] Test on mobile and web
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 2.A.2

#### Task 2.A.4: Update auth-context.tsx
- **Description**: Remove duplicate auth logic, use unified flow
- **Acceptance Criteria**:
  - [ ] Remove duplicate auth state
  - [ ] Use single auth context
  - [ ] Integrate with use-auth.ts
  - [ ] Test session persistence
  - [ ] Verify no auth conflicts
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🔴 CRITICAL
- **Depends On**: 2.A.3

#### Task 2.A.5: Test Unified Auth Flow
- **Description**: Test login on mobile and web
- **Acceptance Criteria**:
  - [ ] Login on mobile app
  - [ ] Verify Manus session created
  - [ ] Verify Supabase session created
  - [ ] Login on web app
  - [ ] Verify both sessions work
  - [ ] Test session persistence
  - [ ] Test logout clears both sessions
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.A.4

#### Task 2.A.6: Remove Deprecated Auth Code
- **Description**: Clean up old authentication implementations
- **Acceptance Criteria**:
  - [ ] Identify deprecated code
  - [ ] Remove old auth contexts
  - [ ] Remove old auth hooks
  - [ ] Update imports across codebase
  - [ ] Verify no broken references
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.A.5

**Subtotal Sprint 2A**: 13 hours

---

### Sprint 2B: Token Refresh Mechanism

#### Task 2.B.1: Design Token Storage Format
- **Description**: Define structure for storing tokens with expiration
- **Acceptance Criteria**:
  - [ ] Define StoredToken interface
  - [ ] Include token, expiresAt, refreshToken
  - [ ] Document storage location (AsyncStorage/localStorage)
  - [ ] Create type definitions
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 2.B.2: Implement getValidToken() Function
- **Description**: Check expiration and refresh if needed
- **Acceptance Criteria**:
  - [ ] Create getValidToken() function
  - [ ] Check if token expired
  - [ ] Check if expiring soon (5 min buffer)
  - [ ] Call refresh endpoint if needed
  - [ ] Update stored token
  - [ ] Return valid token
  - [ ] Test all paths
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.B.1

#### Task 2.B.3: Add Backend Refresh Endpoint
- **Description**: Create POST /api/auth/refresh endpoint
- **Acceptance Criteria**:
  - [ ] Create /api/auth/refresh endpoint
  - [ ] Accept refreshToken parameter
  - [ ] Return new token and refreshToken
  - [ ] Return expiresIn (seconds)
  - [ ] Handle invalid refresh token
  - [ ] Test endpoint
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.B.1

#### Task 2.B.4: Integrate Refresh into API Calls
- **Description**: Auto-refresh before each API call
- **Acceptance Criteria**:
  - [ ] Update API client to call getValidToken()
  - [ ] Refresh before making request
  - [ ] Use refreshed token in headers
  - [ ] Handle refresh failures
  - [ ] Test with expired token
  - [ ] Test with valid token
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.B.2, 2.B.3

#### Task 2.B.5: Test Token Expiration Scenarios
- **Description**: Test all token refresh scenarios
- **Acceptance Criteria**:
  - [ ] Test with valid token (no refresh needed)
  - [ ] Test with expired token (refresh needed)
  - [ ] Test with expiring soon token (refresh needed)
  - [ ] Test refresh failure (clear token, re-login)
  - [ ] Test concurrent requests
  - [ ] Test on mobile and web
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.B.4

**Subtotal Sprint 2B**: 9 hours

---

### Sprint 2C: CSRF Protection

#### Task 2.C.1: Add CSRF Token Generation on Backend
- **Description**: Generate and set CSRF token cookie on login
- **Acceptance Criteria**:
  - [ ] Generate random CSRF token
  - [ ] Set as httpOnly cookie
  - [ ] Set secure flag
  - [ ] Set sameSite=strict
  - [ ] Return token in response
  - [ ] Test cookie is set
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 2.C.2: Add CSRF Validation Middleware
- **Description**: Validate CSRF token on all mutations
- **Acceptance Criteria**:
  - [ ] Create validateCsrfToken middleware
  - [ ] Check X-CSRF-Token header
  - [ ] Compare with cookie value
  - [ ] Reject if mismatch (403)
  - [ ] Apply to all POST/PUT/DELETE routes
  - [ ] Test validation works
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.C.1

#### Task 2.C.3: Update API Client to Include CSRF Token
- **Description**: Read CSRF token from cookie and add to headers
- **Acceptance Criteria**:
  - [ ] Create getCsrfToken() function
  - [ ] Read from document.cookie
  - [ ] Add to X-CSRF-Token header
  - [ ] Apply to all mutations
  - [ ] Test token is included
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.C.1

#### Task 2.C.4: Test CSRF Protection
- **Description**: Verify CSRF protection works
- **Acceptance Criteria**:
  - [ ] Test valid CSRF token accepted
  - [ ] Test missing CSRF token rejected
  - [ ] Test invalid CSRF token rejected
  - [ ] Test cross-origin request rejected
  - [ ] Test GET requests allowed
  - [ ] Test POST requests require token
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 2.C.3

**Subtotal Sprint 2C**: 8 hours

---

### Sprint 2 Summary
- **Total Tasks**: 16
- **Total Effort**: 30 hours (plus 10 hours testing/documentation)
- **Critical Tasks**: 4
- **High Priority**: 12
- **Owner**: Dev1 (single developer)

---

## Sprint 3: Code Quality & Maintainability (Weeks 5-6)
**Goal**: Reduce technical debt and improve code organization  
**Effort**: 70 hours  
**Team**: 2 developers

### Sprint 3A: Add TypeScript Interfaces for Web ERP

#### Task 3.A.1: Create service-types.ts with All Interfaces
- **Description**: Define TypeScript interfaces for all service parameters
- **Acceptance Criteria**:
  - [ ] Create EventParams interface
  - [ ] Create UpdateEventParams interface
  - [ ] Create StaffParams interface
  - [ ] Create ClientParams interface
  - [ ] Create InvoiceParams interface
  - [ ] Create MenuItemParams interface
  - [ ] Add JSDoc comments
  - [ ] Export all types
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None
- **Related Files**: `web/lib/types/service-types.ts` (new)

#### Task 3.A.2: Update Event Service Functions
- **Description**: Apply EventParams types to all event functions
- **Acceptance Criteria**:
  - [ ] Update createEvent() signature
  - [ ] Update updateEvent() signature
  - [ ] Update getEvents() signature
  - [ ] Update getEvent() signature
  - [ ] Add return types
  - [ ] Test TypeScript compilation
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.A.1

#### Task 3.A.3: Update Staff Service Functions
- **Description**: Apply StaffParams types to all staff functions
- **Acceptance Criteria**:
  - [ ] Update createStaff() signature
  - [ ] Update updateStaff() signature
  - [ ] Update getStaff() signature
  - [ ] Add return types
  - [ ] Test TypeScript compilation
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.A.1

#### Task 3.A.4: Update Client Service Functions
- **Description**: Apply ClientParams types to all client functions
- **Acceptance Criteria**:
  - [ ] Update createClient() signature
  - [ ] Update updateClient() signature
  - [ ] Update getClients() signature
  - [ ] Add return types
  - [ ] Test TypeScript compilation
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.A.1

#### Task 3.A.5: Update Invoice Service Functions
- **Description**: Apply InvoiceParams types to all invoice functions
- **Acceptance Criteria**:
  - [ ] Update createInvoice() signature
  - [ ] Update updateInvoice() signature
  - [ ] Update getInvoices() signature
  - [ ] Add return types
  - [ ] Test TypeScript compilation
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.A.1

#### Task 3.A.6: Fix TypeScript Errors in Components
- **Description**: Update form components to use typed services
- **Acceptance Criteria**:
  - [ ] Update EventForm component
  - [ ] Update StaffForm component
  - [ ] Update ClientForm component
  - [ ] Update InvoiceForm component
  - [ ] Fix all TypeScript errors
  - [ ] Test compilation
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 3.A.2, 3.A.3, 3.A.4, 3.A.5

**Subtotal Sprint 3A**: 12 hours

---

### Sprint 3B: Extract Code Duplication

#### Task 3.B.1: Create use-crud-list Hook
- **Description**: Generic hook for CRUD list management
- **Acceptance Criteria**:
  - [ ] Create use-crud-list.ts
  - [ ] Accept fetchFn and searchKeys parameters
  - [ ] Implement search filtering
  - [ ] Implement form open/close
  - [ ] Implement edit mode
  - [ ] Add TypeScript types
  - [ ] Add JSDoc comments
  - [ ] Test hook functionality
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None
- **Related Files**: `web/hooks/use-crud-list.ts` (new)

#### Task 3.B.2: Refactor Events Page
- **Description**: Use use-crud-list hook instead of duplicate code
- **Acceptance Criteria**:
  - [ ] Import use-crud-list hook
  - [ ] Remove duplicate state management
  - [ ] Remove duplicate search logic
  - [ ] Remove duplicate form logic
  - [ ] Test page functionality
  - [ ] Verify no regression
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 3.B.1

#### Task 3.B.3: Refactor Clients Page
- **Description**: Use use-crud-list hook instead of duplicate code
- **Acceptance Criteria**:
  - [ ] Import use-crud-list hook
  - [ ] Remove duplicate code
  - [ ] Test page functionality
  - [ ] Verify no regression
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 3.B.1

#### Task 3.B.4: Refactor Staff Page
- **Description**: Use use-crud-list hook instead of duplicate code
- **Acceptance Criteria**:
  - [ ] Import use-crud-list hook
  - [ ] Remove duplicate code
  - [ ] Test page functionality
  - [ ] Verify no regression
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 3.B.1

#### Task 3.B.5: Refactor Menus Page
- **Description**: Use use-crud-list hook instead of duplicate code
- **Acceptance Criteria**:
  - [ ] Import use-crud-list hook
  - [ ] Remove duplicate code
  - [ ] Test page functionality
  - [ ] Verify no regression
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 3.B.1

#### Task 3.B.6: Regression Testing
- **Description**: Test all pages for functionality after refactoring
- **Acceptance Criteria**:
  - [ ] Test search functionality on all pages
  - [ ] Test create functionality on all pages
  - [ ] Test edit functionality on all pages
  - [ ] Test delete functionality on all pages
  - [ ] Test form validation
  - [ ] All tests passing
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.B.2, 3.B.3, 3.B.4, 3.B.5

**Subtotal Sprint 3B**: 14 hours

---

### Sprint 3C: Split Large Service File

#### Task 3.C.1: Plan Service Modularization
- **Description**: Design directory structure and module organization
- **Acceptance Criteria**:
  - [ ] Plan web/lib/services/ directory
  - [ ] List functions for each service
  - [ ] Identify dependencies
  - [ ] Document import structure
  - [ ] Create implementation plan
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 3.C.2: Extract events.ts Service
- **Description**: Move event CRUD operations to separate file
- **Acceptance Criteria**:
  - [ ] Create events.ts
  - [ ] Move createEvent, updateEvent, deleteEvent, getEvents, getEvent
  - [ ] Add proper types
  - [ ] Update imports
  - [ ] Test functions work
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.1

#### Task 3.C.3: Extract clients.ts Service
- **Description**: Move client CRUD operations to separate file
- **Acceptance Criteria**:
  - [ ] Create clients.ts
  - [ ] Move client functions
  - [ ] Add proper types
  - [ ] Update imports
  - [ ] Test functions work
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.1

#### Task 3.C.4: Extract staff.ts Service
- **Description**: Move staff CRUD operations to separate file
- **Acceptance Criteria**:
  - [ ] Create staff.ts
  - [ ] Move staff functions
  - [ ] Add proper types
  - [ ] Update imports
  - [ ] Test functions work
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.1

#### Task 3.C.5: Extract assignments.ts Service
- **Description**: Move staff assignments and conflict detection
- **Acceptance Criteria**:
  - [ ] Create assignments.ts
  - [ ] Move assignment functions
  - [ ] Move conflict detection functions
  - [ ] Add proper types
  - [ ] Update imports
  - [ ] Test functions work
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.1

#### Task 3.C.6: Extract invoices.ts Service
- **Description**: Move invoice CRUD operations to separate file
- **Acceptance Criteria**:
  - [ ] Create invoices.ts
  - [ ] Move invoice functions
  - [ ] Add proper types
  - [ ] Update imports
  - [ ] Test functions work
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.1

#### Task 3.C.7: Extract templates.ts Service
- **Description**: Move invoice template operations to separate file
- **Acceptance Criteria**:
  - [ ] Create templates.ts
  - [ ] Move template functions
  - [ ] Add proper types
  - [ ] Update imports
  - [ ] Test functions work
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.1

#### Task 3.C.8: Extract realtime.ts Service
- **Description**: Move all subscriptions to separate file
- **Acceptance Criteria**:
  - [ ] Create realtime.ts
  - [ ] Move subscription functions
  - [ ] Add proper types
  - [ ] Update imports
  - [ ] Test subscriptions work
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.1

#### Task 3.C.9: Create index.ts for Re-exports
- **Description**: Maintain backward compatibility with re-exports
- **Acceptance Criteria**:
  - [ ] Create index.ts
  - [ ] Re-export all services
  - [ ] Maintain original import paths
  - [ ] Test imports work
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.2-3.C.8

#### Task 3.C.10: Update All Imports Across Web App
- **Description**: Update import statements to use new service structure
- **Acceptance Criteria**:
  - [ ] Update imports in all pages
  - [ ] Update imports in all components
  - [ ] Update imports in all hooks
  - [ ] Verify no broken imports
  - [ ] Test all pages load
- **Effort**: 3 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.9

#### Task 3.C.11: Regression Testing for Services
- **Description**: Test all services for functionality after refactoring
- **Acceptance Criteria**:
  - [ ] Test all CRUD operations
  - [ ] Test all subscriptions
  - [ ] Test conflict detection
  - [ ] Test invoice generation
  - [ ] All tests passing
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.C.10

**Subtotal Sprint 3C**: 17 hours

---

### Sprint 3D: Standardize Error Handling

#### Task 3.D.1: Create service-result.ts Type
- **Description**: Define ServiceResult<T> union type
- **Acceptance Criteria**:
  - [ ] Create ServiceResult type
  - [ ] Define success variant
  - [ ] Define failure variant
  - [ ] Add error code field
  - [ ] Add JSDoc comments
  - [ ] Export type
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None
- **Related Files**: `web/lib/types/service-result.ts` (new)

#### Task 3.D.2: Update KDS Services
- **Description**: Apply ServiceResult to all KDS service functions
- **Acceptance Criteria**:
  - [ ] Update all KDS service functions
  - [ ] Return ServiceResult<T>
  - [ ] Add error handling
  - [ ] Test functions work
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.D.1

#### Task 3.D.3: Update Inventory Services
- **Description**: Apply ServiceResult to all inventory service functions
- **Acceptance Criteria**:
  - [ ] Update all inventory service functions
  - [ ] Return ServiceResult<T>
  - [ ] Add error handling
  - [ ] Test functions work
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.D.1

#### Task 3.D.4: Update Web ERP Services
- **Description**: Apply ServiceResult to all Web ERP service functions
- **Acceptance Criteria**:
  - [ ] Update all service functions
  - [ ] Return ServiceResult<T>
  - [ ] Add error handling
  - [ ] Test functions work
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.D.1

#### Task 3.D.5: Update UI Components
- **Description**: Update components to handle new error format
- **Acceptance Criteria**:
  - [ ] Update form components
  - [ ] Update page components
  - [ ] Handle success/error uniformly
  - [ ] Show error messages
  - [ ] Test components work
- **Effort**: 3 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 3.D.4

#### Task 3.D.6: Test Error Handling
- **Description**: Test error handling across all services
- **Acceptance Criteria**:
  - [ ] Test successful operations
  - [ ] Test failed operations
  - [ ] Test error messages
  - [ ] Test error recovery
  - [ ] All tests passing
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 3.D.5

**Subtotal Sprint 3D**: 13 hours

---

### Sprint 3 Summary
- **Total Tasks**: 27
- **Total Effort**: 56 hours (plus 14 hours testing/documentation)
- **Critical Tasks**: 0
- **High Priority**: 27
- **Owners**: Dev1 (32h), Dev2 (24h)

---

## Sprint 4: Offline Sync & Scalability (Weeks 7-8)
**Goal**: Unify offline systems and prepare for scale  
**Effort**: 60 hours  
**Team**: 2 developers

### Sprint 4A: Unify Offline Queue Systems

#### Task 4.A.1: Analyze Both Queue Implementations
- **Description**: Document differences between two offline queue systems
- **Acceptance Criteria**:
  - [ ] Review lib/offline-queue.ts
  - [ ] Review shared/offline-queue-service.ts
  - [ ] Review shared/offline-sync-manager.ts
  - [ ] Document differences
  - [ ] Identify which to deprecate
  - [ ] Create migration plan
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 4.A.2: Deprecate Simple offline-queue.ts
- **Description**: Mark simple queue as deprecated
- **Acceptance Criteria**:
  - [ ] Add @deprecated JSDoc comment
  - [ ] Add migration guide
  - [ ] Document replacement
  - [ ] Update imports (if used)
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.A.1

#### Task 4.A.3: Migrate KDS to OfflineSyncManager
- **Description**: Update KDS context to use comprehensive offline system
- **Acceptance Criteria**:
  - [ ] Import OfflineSyncManager
  - [ ] Replace simple queue with manager
  - [ ] Update operation queueing
  - [ ] Test offline operations
  - [ ] Test sync on reconnect
- **Effort**: 3 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.A.1

#### Task 4.A.4: Create offline-sync-helpers.ts
- **Description**: Add KDS-specific operation helpers
- **Acceptance Criteria**:
  - [ ] Create helpers for bumpItem
  - [ ] Create helpers for fireCourse
  - [ ] Create helpers for markCoursePlated
  - [ ] Add proper types
  - [ ] Test helpers work
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.A.3

#### Task 4.A.5: Test Offline KDS Operations
- **Description**: Test complete offline workflow
- **Acceptance Criteria**:
  - [ ] Test bump item offline
  - [ ] Test fire course offline
  - [ ] Test sync on reconnect
  - [ ] Verify data consistency
  - [ ] Test error scenarios
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.A.4

**Subtotal Sprint 4A**: 9.5 hours

---

### Sprint 4B: Implement Conflict Resolution

#### Task 4.B.1: Design Conflict Detection Strategy
- **Description**: Document how to detect conflicts (HTTP 409)
- **Acceptance Criteria**:
  - [ ] Document 409 response handling
  - [ ] Design conflict data structure
  - [ ] Document resolution strategies
  - [ ] Create implementation plan
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 4.B.2: Implement Conflict Detection in Sync Manager
- **Description**: Catch 409 responses and trigger conflict handling
- **Acceptance Criteria**:
  - [ ] Catch 409 status code
  - [ ] Extract server data from response
  - [ ] Trigger conflict resolution flow
  - [ ] Test detection works
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.B.1

#### Task 4.B.3: Implement Client-Wins Strategy
- **Description**: Force update with client data on conflict
- **Acceptance Criteria**:
  - [ ] Implement client-wins resolver
  - [ ] Force update with client data
  - [ ] Retry operation
  - [ ] Test strategy works
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.B.2

#### Task 4.B.4: Implement Server-Wins Strategy
- **Description**: Accept server data and discard client changes
- **Acceptance Criteria**:
  - [ ] Implement server-wins resolver
  - [ ] Accept server data
  - [ ] Update local state
  - [ ] Test strategy works
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.B.2

#### Task 4.B.5: Implement Manual Strategy with Resolver
- **Description**: Allow custom merge logic for conflicts
- **Acceptance Criteria**:
  - [ ] Implement manual resolver
  - [ ] Allow custom merge function
  - [ ] Store conflict for user review
  - [ ] Test strategy works
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.B.2

#### Task 4.B.6: Add Conflict UI (Web + Mobile)
- **Description**: Show conflict dialog with resolution options
- **Acceptance Criteria**:
  - [ ] Create ConflictResolutionDialog (web)
  - [ ] Create ConflictResolutionSheet (mobile)
  - [ ] Show both versions
  - [ ] Allow strategy selection
  - [ ] Test UI works
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 4.B.5

#### Task 4.B.7: Test Conflict Scenarios
- **Description**: Test concurrent edits and conflict resolution
- **Acceptance Criteria**:
  - [ ] Test concurrent updates
  - [ ] Test client-wins resolution
  - [ ] Test server-wins resolution
  - [ ] Test manual resolution
  - [ ] Test all scenarios work
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.B.6

**Subtotal Sprint 4B**: 12.5 hours

---

### Sprint 4C: Move Filtering to Server-Side

#### Task 4.C.1: Design Filter Parameter Structure
- **Description**: Define query parameter format for filters
- **Acceptance Criteria**:
  - [ ] Design filter object structure
  - [ ] Define parameter names
  - [ ] Document filter types
  - [ ] Create type definitions
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 4.C.2: Update getEvents() with Filters
- **Description**: Add search, status, and date range filters
- **Acceptance Criteria**:
  - [ ] Add search parameter
  - [ ] Add status filter
  - [ ] Add date range filters
  - [ ] Implement Supabase query
  - [ ] Test filters work
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.C.1

#### Task 4.C.3: Update getStaff() with Filters
- **Description**: Add search, department, and status filters
- **Acceptance Criteria**:
  - [ ] Add search parameter
  - [ ] Add department filter
  - [ ] Add status filter
  - [ ] Implement Supabase query
  - [ ] Test filters work
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.C.1

#### Task 4.C.4: Update getClients() with Filters
- **Description**: Add search and status filters
- **Acceptance Criteria**:
  - [ ] Add search parameter
  - [ ] Add status filter
  - [ ] Implement Supabase query
  - [ ] Test filters work
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.C.1

#### Task 4.C.5: Add Pagination to All Queries
- **Description**: Implement limit/offset pagination
- **Acceptance Criteria**:
  - [ ] Add limit parameter (default 50)
  - [ ] Add offset parameter
  - [ ] Implement in getEvents()
  - [ ] Implement in getStaff()
  - [ ] Implement in getClients()
  - [ ] Test pagination works
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.C.2, 4.C.3, 4.C.4

#### Task 4.C.6: Update UI to Use Server Filters
- **Description**: Replace client-side filtering with server calls
- **Acceptance Criteria**:
  - [ ] Update Events page
  - [ ] Update Staff page
  - [ ] Update Clients page
  - [ ] Remove client-side filtering
  - [ ] Test pages work
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 4.C.5

#### Task 4.C.7: Performance Testing with Large Datasets
- **Description**: Test performance with 10,000+ records
- **Acceptance Criteria**:
  - [ ] Create test data (10,000+ records)
  - [ ] Test search performance
  - [ ] Test pagination performance
  - [ ] Measure response times
  - [ ] Verify < 1s response time
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.C.6

**Subtotal Sprint 4C**: 12 hours

---

### Sprint 4D: Add Input Validation with Zod

#### Task 4.D.1: Create event-schema.ts
- **Description**: Define Zod schema for event validation
- **Acceptance Criteria**:
  - [ ] Create EventSchema with Zod
  - [ ] Add all required fields
  - [ ] Add validation rules
  - [ ] Add error messages
  - [ ] Export type from schema
- **Effort**: 1.5 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 4.D.2: Create staff-schema.ts
- **Description**: Define Zod schema for staff validation
- **Acceptance Criteria**:
  - [ ] Create StaffSchema with Zod
  - [ ] Add all required fields
  - [ ] Add validation rules
  - [ ] Add error messages
  - [ ] Export type from schema
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 4.D.3: Create client-schema.ts
- **Description**: Define Zod schema for client validation
- **Acceptance Criteria**:
  - [ ] Create ClientSchema with Zod
  - [ ] Add all required fields
  - [ ] Add validation rules
  - [ ] Add error messages
  - [ ] Export type from schema
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 4.D.4: Create invoice-schema.ts
- **Description**: Define Zod schema for invoice validation
- **Acceptance Criteria**:
  - [ ] Create InvoiceSchema with Zod
  - [ ] Add all required fields
  - [ ] Add validation rules
  - [ ] Add error messages
  - [ ] Export type from schema
- **Effort**: 1 hour
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: None

#### Task 4.D.5: Integrate Validation into Event Forms
- **Description**: Add Zod validation to event form
- **Acceptance Criteria**:
  - [ ] Import EventSchema
  - [ ] Validate on submit
  - [ ] Show validation errors
  - [ ] Prevent invalid submission
  - [ ] Test validation works
- **Effort**: 2 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 4.D.1

#### Task 4.D.6: Integrate Validation into Staff Forms
- **Description**: Add Zod validation to staff form
- **Acceptance Criteria**:
  - [ ] Import StaffSchema
  - [ ] Validate on submit
  - [ ] Show validation errors
  - [ ] Prevent invalid submission
  - [ ] Test validation works
- **Effort**: 1.5 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 4.D.2

#### Task 4.D.7: Integrate Validation into Client Forms
- **Description**: Add Zod validation to client form
- **Acceptance Criteria**:
  - [ ] Import ClientSchema
  - [ ] Validate on submit
  - [ ] Show validation errors
  - [ ] Prevent invalid submission
  - [ ] Test validation works
- **Effort**: 1.5 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 4.D.3

#### Task 4.D.8: Integrate Validation into Invoice Forms
- **Description**: Add Zod validation to invoice form
- **Acceptance Criteria**:
  - [ ] Import InvoiceSchema
  - [ ] Validate on submit
  - [ ] Show validation errors
  - [ ] Prevent invalid submission
  - [ ] Test validation works
- **Effort**: 1.5 hours
- **Owner**: Dev2
- **Priority**: 🟡 HIGH
- **Depends On**: 4.D.4

#### Task 4.D.9: Test All Validation Rules
- **Description**: Test validation with valid and invalid inputs
- **Acceptance Criteria**:
  - [ ] Test valid inputs accepted
  - [ ] Test invalid inputs rejected
  - [ ] Test error messages displayed
  - [ ] Test all validation rules
  - [ ] All tests passing
- **Effort**: 2 hours
- **Owner**: Dev1
- **Priority**: 🟡 HIGH
- **Depends On**: 4.D.5, 4.D.6, 4.D.7, 4.D.8

**Subtotal Sprint 4D**: 13.5 hours

---

### Sprint 4 Summary
- **Total Tasks**: 23
- **Total Effort**: 47 hours (plus 13 hours testing/documentation)
- **Critical Tasks**: 0
- **High Priority**: 23
- **Owners**: Dev1 (28h), Dev2 (19h)

---

## Overall Summary

### Total Across All Sprints
- **Total Tasks**: 82 issues
- **Total Effort**: 163.5 hours implementation
- **Testing**: 32.7 hours (20%)
- **Documentation**: 16.4 hours (10%)
- **Total with Overhead**: 212.6 hours

### By Sprint
| Sprint | Tasks | Hours | Focus |
|--------|-------|-------|-------|
| 1 | 16 | 37h | Critical Blockers |
| 2 | 16 | 40h | Security |
| 3 | 27 | 70h | Code Quality |
| 4 | 23 | 60h | Scalability |
| **Total** | **82** | **207h** | - |

### By Team Member (2-Developer Model)
| Role | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Total |
|------|----------|----------|----------|----------|-------|
| Dev1 | 37h | 40h | 32h | 28h | 137h |
| Dev2 | - | - | 24h | 19h | 43h |
| **Total** | **37h** | **40h** | **56h** | **47h** | **180h** |

---

## Task Dependencies Map

### Sprint 1 Dependencies
```
1.A.1 (Analyze KDS)
├── 1.A.2 (Connect Expo)
├── 1.A.3 (Connect Station)
└── 1.A.4 (Connect Plating)
    ├── 1.A.5 (Add Loading)
    ├── 1.A.6 (Add Errors)
    └── 1.A.7 (E2E Test)

1.B.1 (Analyze Inventory)
└── 1.B.2 (Reverse Order)
    └── 1.B.3 (Error Handling)
        └── 1.B.4 (Tests)

1.C.1 (Profile Queries)
└── 1.C.2 (Batch Query)
    └── 1.C.3 (Client Grouping)
        └── 1.C.4 (Benchmark)
```

### Sprint 2 Dependencies
```
2.A.1 (Design Auth Flow)
└── 2.A.2 (Backend Endpoint)
    └── 2.A.3 (use-auth Hook)
        └── 2.A.4 (auth-context)
            └── 2.A.5 (Test)
                └── 2.A.6 (Cleanup)

2.B.1 (Design Storage)
├── 2.B.2 (getValidToken)
│   └── 2.B.4 (Integrate into API)
│       └── 2.B.5 (Test)
└── 2.B.3 (Refresh Endpoint)
    └── 2.B.4 (Integrate)

2.C.1 (Generate Token)
├── 2.C.2 (Validate Middleware)
└── 2.C.3 (Update API Client)
    └── 2.C.4 (Test)
```

### Sprint 3 Dependencies
```
3.A.1 (Create Types)
├── 3.A.2 (Event Functions)
├── 3.A.3 (Staff Functions)
├── 3.A.4 (Client Functions)
├── 3.A.5 (Invoice Functions)
└── 3.A.6 (Fix Components)

3.B.1 (Create Hook)
├── 3.B.2 (Events Page)
├── 3.B.3 (Clients Page)
├── 3.B.4 (Staff Page)
├── 3.B.5 (Menus Page)
└── 3.B.6 (Regression Test)

3.C.1 (Plan Structure)
├── 3.C.2 (events.ts)
├── 3.C.3 (clients.ts)
├── 3.C.4 (staff.ts)
├── 3.C.5 (assignments.ts)
├── 3.C.6 (invoices.ts)
├── 3.C.7 (templates.ts)
├── 3.C.8 (realtime.ts)
└── 3.C.9 (index.ts)
    └── 3.C.10 (Update Imports)
        └── 3.C.11 (Test)

3.D.1 (Create Type)
├── 3.D.2 (KDS Services)
├── 3.D.3 (Inventory Services)
├── 3.D.4 (Web ERP Services)
    └── 3.D.5 (Update Components)
        └── 3.D.6 (Test)
```

### Sprint 4 Dependencies
```
4.A.1 (Analyze Queues)
├── 4.A.2 (Deprecate)
├── 4.A.3 (Migrate KDS)
│   └── 4.A.4 (Helpers)
│       └── 4.A.5 (Test)
└── (No blocking)

4.B.1 (Design Strategy)
└── 4.B.2 (Detect Conflicts)
    ├── 4.B.3 (Client-Wins)
    ├── 4.B.4 (Server-Wins)
    └── 4.B.5 (Manual)
        └── 4.B.6 (UI)
            └── 4.B.7 (Test)

4.C.1 (Design Filters)
├── 4.C.2 (getEvents)
├── 4.C.3 (getStaff)
├── 4.C.4 (getClients)
└── 4.C.5 (Pagination)
    └── 4.C.6 (Update UI)
        └── 4.C.7 (Performance Test)

4.D.1 (event-schema)
4.D.2 (staff-schema)
4.D.3 (client-schema)
4.D.4 (invoice-schema)
├── 4.D.5 (Event Forms)
├── 4.D.6 (Staff Forms)
├── 4.D.7 (Client Forms)
├── 4.D.8 (Invoice Forms)
└── 4.D.9 (Test All)
```

---

## Parallel Work Opportunities

### Sprint 1 (Single Developer)
- All tasks sequential due to dependencies
- No parallelization possible

### Sprint 2 (Single Developer)
- Task 2.A can run in parallel with 2.B and 2.C
- Recommendation: Sequential to maintain focus

### Sprint 3 (Two Developers)
- **Dev1**: 3.A (Types) → 3.C (Services) → 3.D (Errors)
- **Dev2**: 3.B (Hooks) in parallel with Dev1's work
- **Dev1 can assist with 3.C.10 (imports) if 3.B finishes early**

### Sprint 4 (Two Developers)
- **Dev1**: 4.A (Queues) → 4.B (Conflicts) → 4.D (Validation)
- **Dev2**: 4.C (Filtering) in parallel
- **Dev1 can assist with 4.C.6 (UI) if 4.B finishes early**

---

## Success Criteria Checklist

### Sprint 1 Complete When:
- [ ] All KDS screens connected to real data
- [ ] Inventory rollback issue fixed
- [ ] N+1 queries eliminated
- [ ] All 7 critical tasks completed
- [ ] E2E KDS test passing
- [ ] No data inconsistencies

### Sprint 2 Complete When:
- [ ] Unified auth working on mobile and web
- [ ] Token refresh implemented
- [ ] CSRF protection active
- [ ] All 16 tasks completed
- [ ] Security audit passed
- [ ] No auth-related bugs

### Sprint 3 Complete When:
- [ ] TypeScript errors: 201 → 0
- [ ] Code duplication: ~1,200 lines → <100 lines
- [ ] All services properly typed
- [ ] All pages use use-crud-list hook
- [ ] Services modularized
- [ ] Error handling standardized
- [ ] All 27 tasks completed

### Sprint 4 Complete When:
- [ ] Offline queues unified
- [ ] Conflict resolution working
- [ ] Server-side filtering active
- [ ] Input validation comprehensive
- [ ] Performance tested with 10,000+ records
- [ ] All 23 tasks completed

---

**Document Created**: February 3, 2026  
**Total Issues**: 82  
**Ready for Linear Import**: Yes

# CaterKing Technical Roadmap
## Prioritized Implementation Plan for Technical Recommendations

**Document Version**: 1.0  
**Created**: February 3, 2026  
**Status**: Ready for Sprint Planning  
**Overall System Health**: 62% (C-) → Target: 85% (B+) after Phase 6

---

## Executive Summary

This roadmap prioritizes **26 technical recommendations** from comprehensive codebase analysis into **4 strategic sprints** over **8-12 weeks**. The plan balances **critical bug fixes**, **code quality improvements**, **scalability enhancements**, and **team capacity constraints**.

### Key Principles

1. **Fix Critical Issues First** - Data integrity, security, and production blockers
2. **Unblock Development** - Reduce code duplication and technical debt
3. **Enable Scalability** - Prepare for growth (1000+ events, concurrent users)
4. **Maintain Momentum** - Deliver value each sprint with working features
5. **Team Capacity** - Realistic estimates for solo/small team execution

---

## Current State Assessment

### Strengths ✅
- Solid architecture (Expo, Next.js, Supabase)
- Type safety in core systems
- 150+ comprehensive tests
- Real-time sync infrastructure
- Offline queue system
- Professional branding and UI components

### Critical Issues ❗
- **KDS UI disconnected from context** - Using mock data (BLOCKER)
- **Dual auth systems** - Manus OAuth + Supabase Auth not integrated
- **Inventory rollback risk** - Order marked done but inventory unchanged on failure
- **Code duplication** - ~1,200 lines across Web ERP pages

### Scaling Concerns ⚠️
- N+1 queries in KDS (performance)
- Client-side filtering (won't scale past 1,000 events)
- No token refresh (UX issue)
- Untyped service parameters (bug risk)

---

## Sprint Structure & Capacity Model

### Assumptions
- **Team Size**: 1-2 developers (freelance/contractor)
- **Sprint Duration**: 2 weeks
- **Capacity per Sprint**: ~80-100 hours (40-50 hours/dev)
- **Allocation**: 70% implementation, 20% testing, 10% documentation

### Effort Estimates

| Complexity | Effort | Sprint Allocation |
|-----------|--------|-------------------|
| **Quick** | 2-4 hours | 1 developer, 1 day |
| **Medium** | 1-2 days | 1 developer, 2-3 days |
| **Large** | 3-5 days | 1 developer, 1 week |
| **Epic** | 1-2 weeks | 2 developers or 1 dev + 2 weeks |

---

## Sprint Roadmap

## 🔴 **SPRINT 1: Critical Fixes & Blockers (Weeks 1-2)**

**Goal**: Fix production blockers and data integrity issues  
**Team**: 1 senior developer  
**Estimated Capacity**: 80 hours  
**Target Completion**: Feb 17, 2026

### Sprint 1A: KDS UI Integration (CRITICAL BLOCKER)

**Task**: Connect KDS UI screens to real context instead of mock data

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Connect expo.tsx to useKDSInventory() | 2h | 🔴 CRITICAL | Dev1 | Replace mock courses with real data |
| Connect station.tsx to real context | 2h | 🔴 CRITICAL | Dev1 | Replace mock items with real queue |
| Connect plating.tsx to real context | 1.5h | 🔴 CRITICAL | Dev1 | Replace mock courses with real status |
| Add loading states to KDS screens | 2h | 🟡 HIGH | Dev1 | Use LoadingSpinner component |
| Add error handling to KDS screens | 2h | 🟡 HIGH | Dev1 | Use ErrorDisplay component |
| Test end-to-end KDS workflow | 3h | 🟡 HIGH | Dev1 | Create test event, fire courses, verify sync |
| **Subtotal** | **12.5h** | | | |

**Acceptance Criteria**:
- ✅ KDS screens display real data from context
- ✅ No mock data in production code
- ✅ Loading states show during data fetch
- ✅ Errors display with retry options
- ✅ End-to-end test passes (create event → fire courses → verify inventory)

**Deliverable**: Fully functional KDS UI connected to backend

---

### Sprint 1B: Inventory Rollback Fix (CRITICAL)

**Task**: Fix data consistency issue where order marked done but inventory unchanged on failure

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Analyze current bumpItemWithInventory() flow | 1h | 🔴 CRITICAL | Dev1 | Document current issue |
| Implement reverse order (decrement first) | 2h | 🔴 CRITICAL | Dev1 | Decrement inventory before bumping |
| Add transaction wrapper (optional) | 3h | 🟡 HIGH | Dev1 | Create database RPC function |
| Add comprehensive error handling | 2h | 🔴 CRITICAL | Dev1 | Rollback on any failure |
| Write test cases for rollback scenarios | 3h | 🟡 HIGH | Dev1 | Test success/failure paths |
| **Subtotal** | **11h** | | | |

**Acceptance Criteria**:
- ✅ Inventory decrements before order marked done
- ✅ On failure, both operations rolled back
- ✅ Error message clearly indicates failure reason
- ✅ All test cases pass (success, partial failure, network error)
- ✅ No data inconsistency in any scenario

**Deliverable**: Atomic inventory + order operations with guaranteed consistency

---

### Sprint 1C: N+1 Query Fix (PERFORMANCE)

**Task**: Replace per-course order item queries with single batch query

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Identify N+1 query in KDS context | 1h | 🟡 HIGH | Dev1 | Profile current queries |
| Implement batch query for all order items | 2h | 🟡 HIGH | Dev1 | Load all items in one query |
| Add client-side grouping by fired course | 1.5h | 🟡 HIGH | Dev1 | Group items after fetch |
| Performance benchmark before/after | 1h | 🟡 HIGH | Dev1 | Measure improvement |
| **Subtotal** | **5.5h** | | | |

**Acceptance Criteria**:
- ✅ Single query instead of N queries
- ✅ Performance improvement ≥ 50% for 10+ courses
- ✅ Data grouping correct on client
- ✅ No functional changes to UI

**Deliverable**: Optimized KDS data loading

---

### Sprint 1 Summary

| Category | Hours | % of Sprint |
|----------|-------|------------|
| KDS UI Integration | 12.5 | 16% |
| Inventory Rollback Fix | 11 | 14% |
| N+1 Query Fix | 5.5 | 7% |
| Testing & Documentation | 8 | 10% |
| **Total Allocated** | **37** | **46%** |
| **Buffer (Contingency)** | **43** | **54%** |

**Sprint 1 Outcome**: Production-ready KDS with data consistency guarantees

---

## 🟡 **SPRINT 2: Authentication & Security (Weeks 3-4)**

**Goal**: Unify authentication systems and implement security best practices  
**Team**: 1 senior developer  
**Estimated Capacity**: 80 hours  
**Target Completion**: Mar 3, 2026

### Sprint 2A: Unify Dual Authentication Systems (CRITICAL)

**Task**: Integrate Manus OAuth with Supabase Auth into single session

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Design unified auth flow | 2h | 🔴 CRITICAL | Dev1 | Document integration points |
| Update backend OAuth endpoint | 3h | 🔴 CRITICAL | Dev1 | Return both Manus + Supabase tokens |
| Update use-auth.ts hook | 2h | 🔴 CRITICAL | Dev1 | Integrate with Supabase session |
| Update auth-context.tsx | 2h | 🔴 CRITICAL | Dev1 | Remove duplicate auth logic |
| Test unified flow (mobile + web) | 3h | 🟡 HIGH | Dev1 | Login on both platforms |
| Remove deprecated auth code | 1h | 🟡 HIGH | Dev1 | Clean up old implementations |
| **Subtotal** | **13h** | | | |

**Acceptance Criteria**:
- ✅ Single login works on mobile and web
- ✅ Both Manus and Supabase sessions created
- ✅ No duplicate auth contexts
- ✅ Session persists across app restart
- ✅ Logout clears both sessions

**Deliverable**: Unified authentication system

---

### Sprint 2B: Token Refresh Mechanism (HIGH)

**Task**: Implement automatic token refresh before expiration

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Design token storage format | 1h | 🟡 HIGH | Dev1 | Include expiration timestamp |
| Implement getValidToken() function | 2h | 🟡 HIGH | Dev1 | Check expiration, refresh if needed |
| Add backend refresh endpoint | 2h | 🟡 HIGH | Dev1 | POST /api/auth/refresh |
| Integrate refresh into API calls | 2h | 🟡 HIGH | Dev1 | Auto-refresh before each call |
| Test token expiration scenarios | 2h | 🟡 HIGH | Dev1 | Simulate expiration, verify refresh |
| **Subtotal** | **9h** | | | |

**Acceptance Criteria**:
- ✅ Tokens refreshed 5 minutes before expiration
- ✅ No user-facing re-login prompts
- ✅ Refresh failure handled gracefully
- ✅ Old tokens cleared on successful refresh

**Deliverable**: Seamless token management

---

### Sprint 2C: CSRF Protection (SECURITY)

**Task**: Add CSRF token validation to API calls

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Add CSRF token generation on backend | 2h | 🟡 HIGH | Dev1 | Set cookie on login |
| Add CSRF validation middleware | 2h | 🟡 HIGH | Dev1 | Check token on mutations |
| Update API client to include CSRF token | 2h | 🟡 HIGH | Dev1 | Read from cookie, add to headers |
| Test CSRF protection | 2h | 🟡 HIGH | Dev1 | Verify invalid tokens rejected |
| **Subtotal** | **8h** | | | |

**Acceptance Criteria**:
- ✅ CSRF token set on login
- ✅ All POST/PUT/DELETE requests include token
- ✅ Invalid tokens rejected with 403 error
- ✅ No CSRF vulnerabilities in security audit

**Deliverable**: CSRF-protected API

---

### Sprint 2 Summary

| Category | Hours | % of Sprint |
|----------|-------|------------|
| Unify Authentication | 13 | 16% |
| Token Refresh | 9 | 11% |
| CSRF Protection | 8 | 10% |
| Testing & Documentation | 10 | 13% |
| **Total Allocated** | **40** | **50%** |
| **Buffer (Contingency)** | **40** | **50%** |

**Sprint 2 Outcome**: Enterprise-grade authentication and security

---

## 🟢 **SPRINT 3: Code Quality & Maintainability (Weeks 5-6)**

**Goal**: Reduce technical debt and improve code organization  
**Team**: 1-2 developers  
**Estimated Capacity**: 100 hours (2 devs × 50h)  
**Target Completion**: Mar 17, 2026

### Sprint 3A: Add TypeScript Interfaces for Web ERP (MEDIUM)

**Task**: Replace `any` types with proper TypeScript interfaces

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Create service-types.ts with all interfaces | 3h | 🟡 HIGH | Dev1 | EventParams, StaffParams, etc. |
| Update createEvent() and related functions | 2h | 🟡 HIGH | Dev1 | Apply EventParams type |
| Update updateEvent() and related functions | 2h | 🟡 HIGH | Dev1 | Apply UpdateEventParams type |
| Update staff service functions | 2h | 🟡 HIGH | Dev1 | Apply StaffParams types |
| Update client service functions | 1.5h | 🟡 HIGH | Dev1 | Apply ClientParams types |
| Update invoice service functions | 1.5h | 🟡 HIGH | Dev1 | Apply InvoiceParams types |
| Fix TypeScript errors in components | 2h | 🟡 HIGH | Dev1 | Update form components |
| **Subtotal** | **14h** | | | |

**Acceptance Criteria**:
- ✅ No `any` types in service functions
- ✅ All parameters properly typed
- ✅ TypeScript compilation passes (0 errors)
- ✅ IDE autocomplete works for all service calls

**Deliverable**: Type-safe Web ERP services

---

### Sprint 3B: Extract Code Duplication (LARGE)

**Task**: Create use-crud-list hook to eliminate ~1,200 lines of duplicate code

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Create use-crud-list.ts hook | 3h | 🟡 HIGH | Dev1 | Generic CRUD list management |
| Refactor Events page to use hook | 2h | 🟡 HIGH | Dev1 | Replace duplicate code |
| Refactor Clients page to use hook | 2h | 🟡 HIGH | Dev1 | Replace duplicate code |
| Refactor Staff page to use hook | 2h | 🟡 HIGH | Dev1 | Replace duplicate code |
| Refactor Menus page to use hook | 2h | 🟡 HIGH | Dev1 | Replace duplicate code |
| Test all pages for regressions | 3h | 🟡 HIGH | Dev1 | Verify functionality unchanged |
| **Subtotal** | **14h** | | | |

**Acceptance Criteria**:
- ✅ ~1,200 lines of code removed
- ✅ All pages use consistent pattern
- ✅ No functional changes to UI
- ✅ All tests pass

**Deliverable**: Cleaner, more maintainable codebase

---

### Sprint 3C: Split Large Service File (MEDIUM)

**Task**: Refactor 797-line supabase-services.ts into modular services

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Create web/lib/services/ directory structure | 1h | 🟡 HIGH | Dev1 | Plan module organization |
| Extract events.ts service | 2h | 🟡 HIGH | Dev1 | Event CRUD operations |
| Extract clients.ts service | 1.5h | 🟡 HIGH | Dev1 | Client CRUD operations |
| Extract staff.ts service | 1.5h | 🟡 HIGH | Dev1 | Staff CRUD operations |
| Extract assignments.ts service | 1.5h | 🟡 HIGH | Dev1 | Staff assignments + conflicts |
| Extract invoices.ts service | 1.5h | 🟡 HIGH | Dev1 | Invoice CRUD operations |
| Extract templates.ts service | 1h | 🟡 HIGH | Dev1 | Invoice templates |
| Extract realtime.ts service | 1.5h | 🟡 HIGH | Dev1 | All subscriptions |
| Create index.ts for re-exports | 1h | 🟡 HIGH | Dev1 | Maintain backward compatibility |
| Update all imports across web app | 3h | 🟡 HIGH | Dev2 | Parallel with above |
| Test all services for regressions | 2h | 🟡 HIGH | Dev1 | Verify no functionality lost |
| **Subtotal** | **17h** | | | |

**Acceptance Criteria**:
- ✅ Each service file < 200 lines
- ✅ Clear separation of concerns
- ✅ All imports updated
- ✅ No functionality lost
- ✅ All tests pass

**Deliverable**: Modular, organized service layer

---

### Sprint 3D: Standardize Error Handling (MEDIUM)

**Task**: Create ServiceResult<T> type and apply to all services

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Create service-result.ts type | 1h | 🟡 HIGH | Dev1 | Define ServiceResult<T> |
| Update KDS services to use ServiceResult | 2h | 🟡 HIGH | Dev1 | Consistent error format |
| Update inventory services to use ServiceResult | 2h | 🟡 HIGH | Dev1 | Consistent error format |
| Update Web ERP services to use ServiceResult | 3h | 🟡 HIGH | Dev1 | Consistent error format |
| Update UI components to handle new format | 3h | 🟡 HIGH | Dev1 | Use success/error pattern |
| Test error handling across all services | 2h | 🟡 HIGH | Dev1 | Verify consistency |
| **Subtotal** | **13h** | | | |

**Acceptance Criteria**:
- ✅ All services return ServiceResult<T>
- ✅ Consistent error handling pattern
- ✅ UI components handle errors uniformly
- ✅ Error messages clear and actionable

**Deliverable**: Consistent error handling across codebase

---

### Sprint 3 Summary

| Category | Hours | % of Sprint |
|----------|-------|------------|
| TypeScript Interfaces | 14 | 14% |
| Extract Duplication | 14 | 14% |
| Split Service File | 17 | 17% |
| Standardize Errors | 13 | 13% |
| Testing & Documentation | 12 | 12% |
| **Total Allocated** | **70** | **70%** |
| **Buffer (Contingency)** | **30** | **30%** |

**Sprint 3 Outcome**: Professional-grade code organization and quality

---

## 🟢 **SPRINT 4: Offline Sync & Scalability (Weeks 7-8)**

**Goal**: Unify offline systems and prepare for scale  
**Team**: 1-2 developers  
**Estimated Capacity**: 100 hours (2 devs × 50h)  
**Target Completion**: Mar 31, 2026

### Sprint 4A: Unify Offline Queue Systems (MEDIUM)

**Task**: Consolidate two offline queue implementations into one

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Analyze both queue implementations | 1.5h | 🟡 HIGH | Dev1 | Document differences |
| Deprecate simple offline-queue.ts | 1h | 🟡 HIGH | Dev1 | Add deprecation notice |
| Migrate KDS to OfflineSyncManager | 3h | 🟡 HIGH | Dev1 | Update KDS context |
| Create offline-sync-helpers.ts | 2h | 🟡 HIGH | Dev1 | KDS-specific operation helpers |
| Test offline KDS operations | 2h | 🟡 HIGH | Dev1 | Verify sync works |
| **Subtotal** | **9.5h** | | | |

**Acceptance Criteria**:
- ✅ Only one offline queue implementation
- ✅ KDS uses OfflineSyncManager
- ✅ Helper functions for common KDS operations
- ✅ No functionality lost
- ✅ Offline operations tested

**Deliverable**: Unified offline queue system

---

### Sprint 4B: Implement Conflict Resolution (MEDIUM)

**Task**: Add conflict detection and resolution to offline sync

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Design conflict detection strategy | 1.5h | 🟡 HIGH | Dev1 | HTTP 409 handling |
| Implement conflict detection in sync manager | 2h | 🟡 HIGH | Dev1 | Catch 409 responses |
| Implement client-wins strategy | 1.5h | 🟡 HIGH | Dev1 | Force update with client data |
| Implement server-wins strategy | 1.5h | 🟡 HIGH | Dev1 | Accept server data |
| Implement manual strategy with resolver | 2h | 🟡 HIGH | Dev1 | Custom merge logic |
| Add conflict UI (web + mobile) | 2h | 🟡 HIGH | Dev1 | Show conflict dialog |
| Test conflict scenarios | 2h | 🟡 HIGH | Dev1 | Simulate concurrent edits |
| **Subtotal** | **12.5h** | | | |

**Acceptance Criteria**:
- ✅ Conflicts detected on 409 response
- ✅ All 3 strategies implemented
- ✅ User can choose resolution strategy
- ✅ Conflict UI shows both versions
- ✅ Resolved data syncs correctly

**Deliverable**: Robust conflict resolution system

---

### Sprint 4C: Move Filtering to Server-Side (MEDIUM)

**Task**: Implement server-side filtering and pagination for scalability

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Design filter parameter structure | 1h | 🟡 HIGH | Dev1 | Query format |
| Update getEvents() with filters | 2h | 🟡 HIGH | Dev1 | Search, status, date range |
| Update getStaff() with filters | 1.5h | 🟡 HIGH | Dev1 | Search, department, status |
| Update getClients() with filters | 1.5h | 🟡 HIGH | Dev1 | Search, status |
| Add pagination to all queries | 2h | 🟡 HIGH | Dev1 | limit/offset parameters |
| Update UI to use server filters | 2h | 🟡 HIGH | Dev1 | Replace client-side filtering |
| Test with large datasets | 2h | 🟡 HIGH | Dev1 | Performance benchmark |
| **Subtotal** | **12h** | | | |

**Acceptance Criteria**:
- ✅ Filtering done on server
- ✅ Pagination implemented
- ✅ Performance scales to 10,000+ records
- ✅ UI remains responsive
- ✅ No client-side filtering

**Deliverable**: Scalable data retrieval

---

### Sprint 4D: Add Input Validation with Zod (MEDIUM)

**Task**: Implement runtime validation for all forms

| Item | Effort | Priority | Owner | Notes |
|------|--------|----------|-------|-------|
| Create event-schema.ts | 1.5h | 🟡 HIGH | Dev1 | EventSchema with Zod |
| Create staff-schema.ts | 1h | 🟡 HIGH | Dev1 | StaffSchema with Zod |
| Create client-schema.ts | 1h | 🟡 HIGH | Dev1 | ClientSchema with Zod |
| Create invoice-schema.ts | 1h | 🟡 HIGH | Dev1 | InvoiceSchema with Zod |
| Integrate validation into event forms | 2h | 🟡 HIGH | Dev1 | Show validation errors |
| Integrate validation into staff forms | 1.5h | 🟡 HIGH | Dev1 | Show validation errors |
| Integrate validation into client forms | 1.5h | 🟡 HIGH | Dev1 | Show validation errors |
| Integrate validation into invoice forms | 1.5h | 🟡 HIGH | Dev1 | Show validation errors |
| Test validation rules | 2h | 🟡 HIGH | Dev1 | Valid/invalid inputs |
| **Subtotal** | **13.5h** | | | |

**Acceptance Criteria**:
- ✅ All forms have Zod schemas
- ✅ Validation errors shown in UI
- ✅ Invalid data rejected
- ✅ Error messages helpful
- ✅ All validation rules tested

**Deliverable**: Robust input validation

---

### Sprint 4 Summary

| Category | Hours | % of Sprint |
|----------|-------|------------|
| Unify Offline Queues | 9.5 | 10% |
| Conflict Resolution | 12.5 | 13% |
| Server-Side Filtering | 12 | 12% |
| Input Validation | 13.5 | 14% |
| Testing & Documentation | 12 | 12% |
| **Total Allocated** | **59.5** | **60%** |
| **Buffer (Contingency)** | **40.5** | **40%** |

**Sprint 4 Outcome**: Production-ready offline sync and scalable data handling

---

## Post-Sprint Recommendations (Weeks 9-12)

After completing Sprints 1-4, consider these enhancements:

### Phase 5 Continuation (Weeks 9-10)
- **OLD-86**: Web Dashboard Redesign (3-4 days)
- **OLD-87**: Accessibility Improvements - WCAG 2.1 AA (3-4 days)
- **OLD-88**: Performance Optimization - Code splitting, lazy loading (3-4 days)

### Phase 6 Advanced Features (Weeks 11-12)
- Push notifications for staff assignments
- Email/SMS notifications for clients
- Advanced analytics and reporting
- Audit logging for compliance

---

## Success Metrics & KPIs

### Code Quality
| Metric | Current | Target | Sprint |
|--------|---------|--------|--------|
| TypeScript Errors | 201 | 0 | 3 |
| Code Duplication | ~1,200 lines | <100 lines | 3 |
| Test Coverage | 150 tests | 200+ tests | All |
| Type Safety | 60% | 95% | 3 |

### Performance
| Metric | Current | Target | Sprint |
|--------|---------|--------|--------|
| KDS Query Time | N+1 pattern | <500ms | 1 |
| API Response Time | Variable | <1s (p95) | 4 |
| Page Load Time | ~3s | <2s | 4 |
| Offline Sync Time | ~5s | <2s | 4 |

### Security & Reliability
| Metric | Current | Target | Sprint |
|--------|---------|--------|--------|
| CSRF Protection | ❌ None | ✅ Implemented | 2 |
| Token Refresh | ❌ None | ✅ Implemented | 2 |
| Data Consistency | ⚠️ Risky | ✅ Guaranteed | 1 |
| Conflict Resolution | ⚠️ Partial | ✅ Full | 4 |

### System Health
| Metric | Current | Target | After Sprint 4 |
|--------|---------|--------|----------------|
| Overall Health | 62% (C-) | 85% (B+) | ✅ Target |
| Production Readiness | 60% | 90% | ✅ Target |
| Team Velocity | Baseline | +40% | ✅ Expected |

---

## Risk Mitigation

### High-Risk Items

| Risk | Impact | Mitigation | Sprint |
|------|--------|-----------|--------|
| KDS UI integration breaks existing flow | High | Comprehensive testing, feature flags | 1 |
| Auth unification breaks login | High | Parallel testing, rollback plan | 2 |
| Service refactoring introduces bugs | Medium | Extensive test coverage, gradual rollout | 3 |
| Offline conflict resolution edge cases | Medium | Thorough testing, manual resolution UI | 4 |

### Contingency Plans

1. **If KDS integration takes longer**: Reduce N+1 fix scope, defer to Sprint 2
2. **If auth unification blocked**: Implement token refresh first, defer unification
3. **If service refactoring stalls**: Focus on duplication extraction first
4. **If conflict resolution complex**: Implement server-wins only, defer manual strategy

---

## Resource Allocation

### Team Composition Recommendations

**Option A: Single Developer (Freelance)**
- **Timeline**: 12 weeks (4 sprints × 2 weeks)
- **Capacity**: 80 hours/sprint
- **Allocation**: 70% implementation, 20% testing, 10% documentation
- **Risk**: Higher context switching, slower progress on parallel tasks
- **Recommendation**: Prioritize Sprints 1-2 (critical fixes), defer Sprints 3-4

**Option B: Two Developers**
- **Timeline**: 8 weeks (4 sprints × 2 weeks)
- **Capacity**: 100 hours/sprint (50h each)
- **Allocation**: 70% implementation, 20% testing, 10% documentation
- **Risk**: Lower (can parallelize tasks)
- **Recommendation**: Execute all 4 sprints in parallel phases

**Option C: Distributed Team (3+ Developers)**
- **Timeline**: 6 weeks (2-3 sprints compressed)
- **Capacity**: 150+ hours/sprint
- **Allocation**: 70% implementation, 20% testing, 10% documentation
- **Risk**: Coordination overhead, merge conflicts
- **Recommendation**: Assign by domain (KDS, Auth, Services, Sync)

### Recommended: Option B (2 Developers)
- **Dev 1**: Backend/Infrastructure (Auth, Services, Sync)
- **Dev 2**: Frontend/Integration (UI, Forms, Testing)
- **Shared**: Code review, documentation, deployment

---

## Implementation Checklist

### Pre-Sprint Checklist
- [ ] Team alignment on sprint goals
- [ ] Development environment setup
- [ ] Test database prepared
- [ ] CI/CD pipeline ready
- [ ] Slack/communication channel established

### Per-Sprint Checklist
- [ ] Sprint planning meeting (30 min)
- [ ] Daily standup (15 min)
- [ ] Code review process established
- [ ] Test coverage target defined
- [ ] Sprint retrospective (30 min)

### Post-Sprint Checklist
- [ ] All tests passing
- [ ] Code review complete
- [ ] Documentation updated
- [ ] Changelog created
- [ ] Deployment to staging
- [ ] Stakeholder demo

---

## Deployment Strategy

### Staging Deployment (After Each Sprint)
```
1. Merge to staging branch
2. Run full test suite
3. Deploy to staging environment
4. Smoke test critical workflows
5. Get stakeholder approval
```

### Production Deployment (After Sprint 2 Minimum)
```
1. Create release branch
2. Update version number
3. Generate changelog
4. Deploy to production (blue-green)
5. Monitor error rates
6. Rollback plan ready
```

### Feature Flags for High-Risk Changes
- Unified auth: `FEATURE_UNIFIED_AUTH=true`
- Conflict resolution: `FEATURE_CONFLICT_RESOLUTION=true`
- Server-side filtering: `FEATURE_SERVER_FILTERS=true`

---

## Communication Plan

### Stakeholder Updates
- **Weekly**: Progress report (email)
- **Bi-weekly**: Sprint review demo (30 min)
- **Monthly**: Roadmap review (1 hour)

### Team Communication
- **Daily**: Standup (15 min, async Slack)
- **Weekly**: Code review sync (30 min)
- **Bi-weekly**: Sprint planning (1 hour)

### Documentation
- **Per-task**: Inline code comments
- **Per-sprint**: Sprint summary in CHANGELOG.md
- **Per-phase**: Architecture decision records (ADRs)

---

## Success Criteria

### Sprint 1: ✅ Production Blockers Fixed
- [ ] KDS UI fully functional with real data
- [ ] Inventory rollback issue resolved
- [ ] N+1 queries eliminated
- [ ] All critical tests passing

### Sprint 2: ✅ Enterprise Security
- [ ] Unified authentication working
- [ ] Token refresh implemented
- [ ] CSRF protection active
- [ ] Security audit passed

### Sprint 3: ✅ Code Quality Excellence
- [ ] TypeScript 0 errors
- [ ] Code duplication removed
- [ ] Services modularized
- [ ] Error handling standardized

### Sprint 4: ✅ Scalability Ready
- [ ] Offline sync unified
- [ ] Conflict resolution working
- [ ] Server-side filtering active
- [ ] Input validation comprehensive

---

## Appendix: Effort Breakdown by Category

### Total Effort Summary (All Sprints)

| Category | Hours | % of Total |
|----------|-------|-----------|
| KDS & Infrastructure | 28.5 | 18% |
| Authentication & Security | 30 | 19% |
| Code Quality | 58 | 37% |
| Offline & Sync | 21.5 | 14% |
| Validation & Scalability | 25.5 | 16% |
| **Total Implementation** | **163.5** | **100%** |
| **Testing (20%)** | **32.7** | - |
| **Documentation (10%)** | **16.4** | - |
| **Total with Overhead** | **212.6** | - |

### Effort by Complexity

| Complexity | Count | Hours | % |
|-----------|-------|-------|---|
| Quick (2-4h) | 12 | 36 | 22% |
| Medium (1-2d) | 28 | 84 | 51% |
| Large (3-5d) | 8 | 40 | 24% |
| Epic (1-2w) | 2 | 3.5 | 2% |

---

## Conclusion

This roadmap provides a **realistic, prioritized path** to transform CaterKing from a functional prototype (62% health) to a **production-ready enterprise system (85%+ health)** in **8-12 weeks**.

### Key Takeaways

1. **Sprint 1 is Critical** - Fix blockers before scaling
2. **Two-Developer Team is Optimal** - Balances speed and complexity
3. **Security First** - Auth and CSRF protection in Sprint 2
4. **Code Quality Matters** - Invest in refactoring (Sprint 3)
5. **Plan for Scale** - Server-side filtering and conflict resolution (Sprint 4)

### Next Steps

1. **Review with team** - Validate effort estimates
2. **Adjust timeline** - Based on actual team capacity
3. **Create Linear issues** - Break down sprints into tasks
4. **Set up CI/CD** - Prepare for automated testing
5. **Schedule kickoff** - Sprint 1 planning meeting

---

**Document Owner**: AI Coordination Agent  
**Last Updated**: February 3, 2026  
**Next Review**: After Sprint 1 Completion

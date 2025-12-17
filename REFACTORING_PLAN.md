# Refactoring Plan - The Long Rest VTT

## 🎯 Goal
Fix critical technical debt and architectural issues to make the codebase production-ready.

---

## Phase 1: Critical Fixes (Week 1) 🔴

### 1.1 Centralize Access Control
**Problem**: Access control logic is duplicated across 10+ routers, inconsistent, and buggy.

**Solution**: Create reusable middleware

**Tasks**:
- [ ] Create `sessionAccessMiddleware` in `src/server/api/trpc.ts`
- [ ] Create helper function `checkSessionAccess(sessionId, userId)` 
- [ ] Refactor all routers to use middleware:
  - [ ] `token.ts`
  - [ ] `fog-of-war.ts`
  - [ ] `drawing.ts`
  - [ ] `spell-effect.ts`
  - [ ] `initiative.ts`
  - [ ] `vision.ts`
  - [ ] `chat.ts`
- [ ] Fix bug: `session.campaign.characters.length > 0` → check user's characters
- [ ] Add unit tests for access control logic

**Files to create/modify**:
- `src/server/api/middleware/session-access.ts` (new)
- `src/server/api/trpc.ts` (modify)
- All router files (modify)

---

### 1.2 Fix SSE Reconnection Logic
**Problem**: Memory leaks, no exponential backoff, poor error handling.

**Solution**: Robust reconnection with cleanup

**Tasks**:
- [ ] Implement exponential backoff (1s, 2s, 4s, 8s, max 30s)
- [ ] Proper cleanup of EventSource on unmount
- [ ] Connection state management (connecting, connected, error, disconnected)
- [ ] Max retry limit with user notification
- [ ] Handle network errors gracefully

**Files to modify**:
- `src/app/sessions/[id]/_components/use-session-events.ts`

---

### 1.3 Add Error Boundaries
**Problem**: One component crash takes down entire app.

**Solution**: React Error Boundaries around major sections

**Tasks**:
- [ ] Create `ErrorBoundary` component
- [ ] Wrap session view sections:
  - [ ] MapCanvas
  - [ ] TokenPanel
  - [ ] ChatPanel
  - [ ] InitiativeTracker
- [ ] Add fallback UI with retry option
- [ ] Log errors to monitoring service (future)

**Files to create**:
- `src/app/_components/error-boundary.tsx`

**Files to modify**:
- `src/app/sessions/[id]/_components/session-view.tsx`

---

### 1.4 Fix Token State Management
**Problem**: Three sources of truth causing sync issues.

**Solution**: Single source of truth (React Query) with SSE invalidation

**Tasks**:
- [ ] Remove local state from `useSessionEvents`
- [ ] Use SSE events to invalidate React Query cache
- [ ] Remove `initialTokens` prop, fetch via React Query
- [ ] Ensure optimistic updates work with new flow

**Files to modify**:
- `src/app/sessions/[id]/_components/use-session-events.ts`
- `src/app/sessions/[id]/_components/session-view.tsx`
- `src/app/sessions/[id]/_components/map-canvas.tsx`

---

## Phase 2: High Priority (Week 2) 🟠

### 2.1 Persist Initiative Tracker
**Problem**: Initiative values are hardcoded to 0, not saved.

**Solution**: Add Initiative model or store in Token

**Tasks**:
- [ ] Option A: Add `initiative` field to Token model
- [ ] Option B: Create separate Initiative model (better for history)
- [ ] Update `initiativeRouter.setInitiative` to actually save
- [ ] Update `initiativeRouter.get` to return real data
- [ ] Add real-time sync for initiative changes

**Files to modify**:
- `prisma/schema.prisma` (if new model)
- `src/server/api/routers/initiative.ts`
- `src/app/sessions/[id]/_components/initiative-tracker.tsx`

---

### 2.2 Optimize Canvas Rendering
**Problem**: Re-renders on every token move, expensive calculations not memoized.

**Solution**: Memoization and requestAnimationFrame

**Tasks**:
- [ ] Memoize `gridToPixel` and `pixelToGrid` calculations
- [ ] Use `useMemo` for token rendering data
- [ ] Implement `requestAnimationFrame` for canvas updates
- [ ] Debounce token movement updates
- [ ] Only re-render changed tokens

**Files to modify**:
- `src/app/sessions/[id]/_components/map-canvas.tsx`

---

### 2.3 Add Rate Limiting
**Problem**: No protection against spam/abuse.

**Solution**: Rate limiting middleware

**Tasks**:
- [ ] Install rate limiting library (Upstash Redis or Vercel Edge Config)
- [ ] Create rate limit middleware
- [ ] Apply to mutations:
  - [ ] Token movement (10/sec)
  - [ ] Chat messages (5/sec)
  - [ ] Drawing updates (20/sec)
  - [ ] Spell effects (5/sec)
- [ ] Return proper error messages

**Files to create**:
- `src/server/api/middleware/rate-limit.ts`

**Files to modify**:
- `src/server/api/trpc.ts`
- Router files (apply middleware)

---

### 2.4 Standardize Error Handling
**Problem**: Inconsistent error handling across components.

**Solution**: Toast notifications + error boundary

**Tasks**:
- [ ] Install toast library (sonner or react-hot-toast)
- [ ] Create error handler utility
- [ ] Replace all `setError` with toast notifications
- [ ] Add error logging (console.error in dev, service in prod)
- [ ] Standardize error messages

**Files to create**:
- `src/lib/error-handler.ts`
- `src/components/ui/toast.tsx` (if using shadcn toast)

**Files to modify**:
- All components with error handling

---

## Phase 3: Medium Priority (Week 3-4) 🟡

### 3.1 Migrate File Storage
**Problem**: Local filesystem won't work in serverless/containers.

**Solution**: Cloud storage (S3/R2/Vercel Blob)

**Tasks**:
- [ ] Choose storage provider (Vercel Blob recommended for Vercel)
- [ ] Create storage abstraction layer
- [ ] Migrate avatar uploads
- [ ] Migrate character avatar uploads
- [ ] Migrate map uploads
- [ ] Update API routes
- [ ] Add migration script for existing files

**Files to create**:
- `src/lib/storage.ts`

**Files to modify**:
- `src/app/api/upload/avatar/route.ts`
- `src/app/api/upload/character-avatar/route.ts`
- Map upload routes

---

### 3.2 Add Input Validation
**Problem**: Missing validation for file sizes, image dimensions, etc.

**Solution**: Comprehensive validation

**Tasks**:
- [ ] Add file size limits (5MB avatars, 50MB maps)
- [ ] Validate image dimensions
- [ ] Validate file types (MIME type checking)
- [ ] Add image processing (resize, optimize)
- [ ] Update Zod schemas

**Files to modify**:
- Upload API routes
- tRPC input schemas

---

### 3.3 Performance Audit
**Problem**: Unknown performance bottlenecks.

**Solution**: Profiling and optimization

**Tasks**:
- [ ] Add React DevTools Profiler
- [ ] Identify slow queries (add logging)
- [ ] Optimize Prisma queries (N+1 fixes)
- [ ] Add database indexes
- [ ] Bundle size analysis
- [ ] Lighthouse audit

---

## Phase 4: Nice to Have (Future) 🟢

### 4.1 Add Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] User analytics (PostHog)

### 4.2 Add Tests
- [ ] Unit tests for middleware
- [ ] Integration tests for routers
- [ ] E2E tests for critical flows

### 4.3 Documentation
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Deployment guide

---

## Implementation Order

**Week 1**:
1. Centralize Access Control (Day 1-2)
2. Fix SSE Reconnection (Day 2-3)
3. Add Error Boundaries (Day 3-4)
4. Fix Token State Management (Day 4-5)

**Week 2**:
1. Persist Initiative Tracker (Day 1-2)
2. Optimize Canvas Rendering (Day 2-3)
3. Add Rate Limiting (Day 3-4)
4. Standardize Error Handling (Day 4-5)

**Week 3-4**:
1. Migrate File Storage
2. Add Input Validation
3. Performance Audit

---

## Success Metrics

- ✅ Zero duplicate access control code
- ✅ SSE reconnects reliably with exponential backoff
- ✅ App doesn't crash on component errors
- ✅ Token state always in sync
- ✅ Initiative values persist
- ✅ Canvas renders smoothly at 60fps
- ✅ Rate limiting prevents abuse
- ✅ Consistent error handling everywhere
- ✅ Files stored in cloud storage
- ✅ All inputs validated

---

## Notes

- Each phase should be tested before moving to next
- Keep feature development separate from refactoring
- Document breaking changes
- Update this plan as we discover new issues



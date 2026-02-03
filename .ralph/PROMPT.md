# PRD Section 13.2 Full Verification

## Goal
Fix all application bugs so ALL PRD Section 13.2 strict E2E tests pass.

## Test Scenarios (Priority Order)

### Customer Journeys
1. **Quote Happy Path** (`prd-quote-happy-path.spec.ts`)
   - Location: `/estimate` page
   - Flow: Home → Get Quote → Chat → Provide project details → Submit Request → Fill contact → Success
   - Expected: Lead created in database, success modal appears

2. **Quote Mobile** (`prd-quote-mobile.spec.ts`)
   - Location: `/estimate` page at 375px viewport
   - Flow: Same as Quote Happy Path but on mobile
   - Expected: All interactions work, touch targets >= 44px

3. **Visualizer Happy Path** (`prd-visualizer-happy-path.spec.ts`)
   - Location: `/visualizer` page
   - Flow: Upload photo → Select room type → Select style → Generate → View results
   - Expected: 4 AI-generated concepts displayed, no "Failed to store" errors

### Admin Journeys
4. **Admin Login** (`prd-admin-login.spec.ts`)
   - Location: `/admin/login` page
   - Flow: Enter credentials → Sign in → View dashboard
   - Expected: Successful auth, redirect to `/admin/leads`, leads table visible
   - Test credentials: admin@redwhitereno.ca / testpassword123

5. **Admin Send Quote** (`prd-admin-send-quote.spec.ts`)
   - Location: `/admin/leads/[id]` page
   - Flow: View lead → Edit quote → Add line items → Download PDF → Send email
   - Expected: PDF generates, email sends, status updates

## Verification Command
```bash
npm run test:e2e -- --grep "strict" --reporter=list
```

## Completion Criteria
- All 5 test scenarios pass on Mobile, Tablet, AND Desktop viewports
- Zero "strict mode violation" errors
- Zero timeout failures (tests have extended timeouts for AI operations)
- Build passes: `npm run build`

## Known Issues from Previous Session
- Touch targets < 44px on quick reply buttons (CSS fix needed)
- Admin tests require test user in Supabase Auth

## Rules
- Fix APPLICATION code, NOT test files
- Tests define expected PRD behavior - they are correct
- Run full test suite after each fix attempt
- Follow TypeScript strict mode
- Preserve existing functionality while fixing bugs

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript 5.7 (strict)
- Supabase (database + storage + auth)
- Tailwind v4
- shadcn/ui
- Playwright for E2E tests

## Key Files to Investigate

### Quote Submission Issues
- `src/components/chat/chat-interface.tsx`
- `src/components/chat/submit-request-modal.tsx`
- `src/app/api/leads/route.ts`
- `tests/e2e/strict/helpers.ts` (for test utilities understanding)

### Visualizer Issues
- `src/components/visualizer/visualizer-form.tsx`
- `src/app/api/ai/visualize/route.ts`
- `src/lib/db/server.ts` (Supabase client)

### Admin Auth Issues
- `src/proxy.ts` (auth middleware)
- `src/lib/auth/admin.ts`
- `src/components/admin/login-form.tsx`

### Touch Target Issues
- `src/components/chat/quick-replies.tsx`
- Need min-height: 44px for mobile accessibility

## Debugging Tips
1. Run failing test to get exact error
2. Check browser console for client errors
3. Check terminal for server/API errors
4. Check Supabase dashboard for database/storage errors
5. Fix root cause in application code
6. Re-run test to verify fix

<promise>TESTS_COMPLETE</promise>

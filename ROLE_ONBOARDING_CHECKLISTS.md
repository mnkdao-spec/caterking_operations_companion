# Role-Specific Onboarding Checklists

Quick reference checklists for each team role to complete onboarding efficiently.

---

## Mobile Developer Onboarding (2-3 days)

### Day 1: Setup & Understanding

- [ ] Clone repository and install dependencies
- [ ] Set up environment variables
- [ ] Run `pnpm dev` and verify mobile app loads
- [ ] Scan QR code with Expo Go app
- [ ] Navigate through all 5 mobile screens
- [ ] Read PROJECT_STATUS_SUMMARY.md
- [ ] Read TEAM_ONBOARDING.md (Mobile Developer section)

### Day 2: Architecture Deep Dive

- [ ] Read INTEGRATION_GUIDE.md
- [ ] Study `shared/database-types.ts` - understand all entity types
- [ ] Study `shared/supabase-service.ts` - learn CRUD operations
- [ ] Study `shared/offline-queue-service.ts` - understand offline persistence
- [ ] Review `shared/use-offline-sync.ts` - understand React hooks
- [ ] Read `app/lib/kds-context.tsx` - understand state management
- [ ] Review `app/(tabs)/index.tsx` - understand screen structure

### Day 3: Hands-On & First Task

- [ ] Review NativeWind documentation
- [ ] Review Tailwind CSS documentation
- [ ] Pick first task from Phase 5 (recommended: OLD-82)
- [ ] Create feature branch: `git checkout -b feature/OLD-XX-description`
- [ ] Implement feature following project conventions
- [ ] Write tests for new code
- [ ] Run `pnpm test` and verify all tests pass
- [ ] Run `pnpm check` and fix any TypeScript errors
- [ ] Test in Expo Go on real device or emulator
- [ ] Create pull request with clear description

### Verification

- [ ] Mobile app runs without errors
- [ ] Can navigate all screens
- [ ] Understand offline queue system
- [ ] Comfortable with NativeWind/Tailwind
- [ ] First PR submitted

### Key Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev/docs)
- [NativeWind](https://www.nativewind.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Web Developer Onboarding (2-3 days)

### Day 1: Setup & Understanding

- [ ] Clone repository and install dependencies
- [ ] Set up environment variables
- [ ] Run `pnpm dev` and verify web app loads at http://localhost:3000
- [ ] Navigate through all 6 web pages
- [ ] Interact with forms and data entry
- [ ] Read PROJECT_STATUS_SUMMARY.md
- [ ] Read TEAM_ONBOARDING.md (Web Developer section)

### Day 2: Architecture Deep Dive

- [ ] Read INTEGRATION_GUIDE.md
- [ ] Study `shared/database-types.ts` - understand all entity types
- [ ] Study `web/lib/supabase-services.ts` - learn database operations
- [ ] Review `web/pages/index.tsx` - understand dashboard structure
- [ ] Review `web/components/event-form.tsx` - understand form patterns
- [ ] Study real-time subscriptions in existing pages
- [ ] Understand Tailwind CSS configuration

### Day 3: Hands-On & First Task

- [ ] Review Next.js documentation
- [ ] Review React documentation
- [ ] Pick first task from Phase 5 (recommended: OLD-86)
- [ ] Create feature branch: `git checkout -b feature/OLD-XX-description`
- [ ] Implement feature following project conventions
- [ ] Write tests for new code
- [ ] Run `pnpm test` and verify all tests pass
- [ ] Run `pnpm check` and fix any TypeScript errors
- [ ] Test in browser at http://localhost:3000
- [ ] Create pull request with screenshots

### Verification

- [ ] Web app runs without errors
- [ ] Can navigate all pages
- [ ] Understand real-time sync
- [ ] Comfortable with Next.js and Tailwind
- [ ] First PR submitted

### Key Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## Backend Developer Onboarding (2-3 days)

### Day 1: Setup & Understanding

- [ ] Clone repository and install dependencies
- [ ] Set up environment variables
- [ ] Run `pnpm dev` and verify servers start
- [ ] Test API endpoints using curl or Postman
- [ ] Read PROJECT_STATUS_SUMMARY.md
- [ ] Read server/README.md
- [ ] Read TEAM_ONBOARDING.md (Backend Developer section)

### Day 2: Architecture Deep Dive

- [ ] Read INTEGRATION_GUIDE.md
- [ ] Study database schema in `migrations/`
- [ ] Study `shared/database-types.ts` - understand entity types
- [ ] Study `shared/supabase-service.ts` - understand CRUD patterns
- [ ] Review `server/_core/index.ts` - understand server setup
- [ ] Review API routes in `server/_core/routes/`
- [ ] Understand tRPC setup and patterns

### Day 3: Hands-On & First Task

- [ ] Review Express.js documentation
- [ ] Review tRPC documentation
- [ ] Review Drizzle ORM documentation
- [ ] Pick first task from Phase 6 (recommended: OLD-90)
- [ ] Create feature branch: `git checkout -b feature/OLD-XX-description`
- [ ] Implement API endpoints following project patterns
- [ ] Write tests for new code
- [ ] Run `pnpm test` and verify all tests pass
- [ ] Run `pnpm check` and fix any TypeScript errors
- [ ] Test endpoints using curl or Postman
- [ ] Create pull request with API documentation

### Verification

- [ ] Backend server runs without errors
- [ ] Can test API endpoints
- [ ] Understand database schema
- [ ] Comfortable with Express and tRPC
- [ ] First PR submitted

### Key Resources

- [Express.js](https://expressjs.com)
- [tRPC](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Supabase](https://supabase.com/docs)

---

## QA/Testing Engineer Onboarding (1-2 days)

### Day 1: Setup & Understanding

- [ ] Clone repository and install dependencies
- [ ] Set up environment variables
- [ ] Run `pnpm test` and verify all tests pass
- [ ] Review `web/__tests__/` directory structure
- [ ] Read PROJECT_STATUS_SUMMARY.md
- [ ] Read TEAM_ONBOARDING.md (QA/Testing section)

### Day 2: Test Strategy & First Task

- [ ] Read INTEGRATION_GUIDE.md
- [ ] Review existing test files to understand patterns
- [ ] Study Vitest documentation
- [ ] Study Testing Library documentation
- [ ] Review test data setup in `web/__tests__/setup.ts`
- [ ] Pick first task: Create tests for Phase 5 features
- [ ] Create feature branch: `git checkout -b feature/OLD-XX-tests`
- [ ] Write comprehensive tests for assigned feature
- [ ] Run `pnpm test` and verify all tests pass
- [ ] Achieve 80%+ code coverage
- [ ] Create pull request with test documentation

### Verification

- [ ] All tests run without errors
- [ ] Understand test patterns
- [ ] Can write new tests
- [ ] Comfortable with Vitest
- [ ] First PR submitted

### Key Resources

- [Vitest](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Jest](https://jestjs.io) (similar patterns)

---

## DevOps/Infrastructure Engineer Onboarding (1-2 days)

### Day 1: Setup & Understanding

- [ ] Clone repository and install dependencies
- [ ] Set up environment variables
- [ ] Run `pnpm dev` and verify all servers start
- [ ] Read PROJECT_STATUS_SUMMARY.md
- [ ] Read server/README.md
- [ ] Read TEAM_ONBOARDING.md (DevOps section)

### Day 2: Infrastructure Planning & First Task

- [ ] Review current deployment setup
- [ ] Check for existing GitHub Actions configuration
- [ ] Review Supabase deployment options
- [ ] Study GitHub Actions documentation
- [ ] Review Docker documentation
- [ ] Pick first task from Phase 8: Set up CI/CD pipeline
- [ ] Create feature branch: `git checkout -b feature/OLD-XX-cicd`
- [ ] Create GitHub Actions workflow for testing and building
- [ ] Test workflow with PR
- [ ] Document deployment process
- [ ] Create pull request with workflow files

### Verification

- [ ] All servers run without errors
- [ ] Understand deployment options
- [ ] Comfortable with GitHub Actions
- [ ] First PR submitted

### Key Resources

- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker](https://docs.docker.com)
- [Supabase Deployment](https://supabase.com/docs/guides/hosting/overview)

---

## General Onboarding Checklist (All Roles)

### Before Day 1

- [ ] GitHub account with repository access
- [ ] Linear account with project access
- [ ] Supabase credentials provided
- [ ] Slack account and #caterking-dev channel access
- [ ] Code editor installed (VS Code recommended)
- [ ] Node.js 18+ installed
- [ ] Git installed and configured

### Day 1 (All Roles)

- [ ] Clone repository
- [ ] Install dependencies
- [ ] Set up environment variables
- [ ] Run development servers
- [ ] Verify no errors
- [ ] Read PROJECT_STATUS_SUMMARY.md
- [ ] Read TEAM_ONBOARDING.md

### Day 2 (All Roles)

- [ ] Read INTEGRATION_GUIDE.md
- [ ] Study shared code (`shared/` directory)
- [ ] Understand project architecture
- [ ] Review relevant documentation for your role
- [ ] Study existing code examples

### Day 3 (All Roles)

- [ ] Pick first task from Linear
- [ ] Create feature branch
- [ ] Implement feature
- [ ] Write tests
- [ ] Create pull request
- [ ] Request review

### End of Week (All Roles)

- [ ] First PR merged
- [ ] Comfortable with codebase
- [ ] Understand development workflow
- [ ] Know who to ask for help
- [ ] Ready for next task

---

## Troubleshooting

### Common Issues

**Issue**: Dependencies fail to install  
**Solution**: 
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue**: Environment variables not working  
**Solution**: Verify `.env.local` files exist in correct directories with correct values

**Issue**: Mobile app won't load  
**Solution**: 
```bash
pnpm dev
# Scan QR code with Expo Go
# Or run: pnpm ios / pnpm android
```

**Issue**: Web app shows TypeScript errors  
**Solution**: 
```bash
pnpm check
# Fix errors shown
```

**Issue**: Tests fail  
**Solution**: 
```bash
pnpm test
# Review test output
# Check test setup in web/__tests__/setup.ts
```

---

## Success Indicators

You're successfully onboarded when you can:

1. ✅ Run all apps locally without errors
2. ✅ Explain project architecture
3. ✅ Navigate codebase independently
4. ✅ Create feature branch and implement code
5. ✅ Write tests for your code
6. ✅ Create and submit PR
7. ✅ Address code review feedback
8. ✅ Merge PR to main
9. ✅ Ask for help appropriately
10. ✅ Pick and complete next task independently

---

## Support Resources

### Documentation
- PROJECT_STATUS_SUMMARY.md
- TEAM_ONBOARDING.md
- INTEGRATION_GUIDE.md
- OFFLINE_QUEUE_GUIDE.md
- server/README.md

### Communication
- #caterking-dev Slack channel
- Linear issue comments
- GitHub PR discussions
- Team sync meetings

### External Resources
- Framework documentation (links in role-specific sections)
- Stack Overflow
- GitHub discussions
- Community forums

---

## Next Steps After Onboarding

1. **Complete First Task** - Submit and merge first PR
2. **Pick Second Task** - Continue with Phase 5 tasks
3. **Pair Programming** - Schedule session with team member
4. **Knowledge Sharing** - Share what you learned
5. **Mentoring** - Help onboard next team member

---

*Last Updated: January 31, 2026*  
*For questions, post in #caterking-dev or comment on Linear*

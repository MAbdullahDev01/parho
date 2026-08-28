```text
Frontend
├─ app/
│  ├─ dashboard/
│  │  ├─ admin/
│  │  │  ├─ [page.tsx](frontend/app/dashboard/admin/page.tsx)  <!-- Admin verification review dashboard -->
│  │  │  ├─ [layout.tsx](frontend/app/dashboard/admin/layout.tsx)  <!-- Admin dashboard layout wrapper -->
│  │  │  ├─ [_actions.ts](frontend/app/dashboard/admin/_actions.ts)  <!-- Server actions for admin operations -->
│  │  │  └─ [VerificationReview.tsx](frontend/app/dashboard/admin/VerificationReview.tsx)  <!-- Component to review and approve/reject tutor transcripts -->
│  │  ├─ student/
│  │  │  ├─ [page.tsx](frontend/app/dashboard/student/page.tsx)  <!-- Student dashboard home -->
│  │  │  └─ [layout.tsx](frontend/app/dashboard/student/layout.tsx)  <!-- Student dashboard layout wrapper -->
│  │  ├─ tutor/
│  │  │  ├─ [page.tsx](frontend/app/dashboard/tutor/page.tsx)  <!-- Tutor dashboard home -->
│  │  │  ├─ [layout.tsx](frontend/app/dashboard/tutor/layout.tsx)  <!-- Tutor dashboard layout wrapper -->
│  │  │  └─ [_actions.ts](frontend/app/dashboard/tutor/_actions.ts)  <!-- Server actions for tutor operations -->
│  │  ├─ [page.tsx](frontend/app/dashboard/page.tsx)  <!-- Root dashboard page (redirects based on role) -->
│  │  └─ [loading.tsx](frontend/app/dashboard/loading.tsx)  <!-- Loading skeleton for dashboard -->
│  ├─ onboarding/
│  │  ├─ tutor-setup/
│  │  │  ├─ [page.tsx](frontend/app/onboarding/tutor-setup/page.tsx)  <!-- Tutor setup page entry point -->
│  │  │  ├─ [TutorSetup.tsx](frontend/app/onboarding/tutor-setup/TutorSetup.tsx)  <!-- Four-step tutor setup wizard (subjects → transcripts → level → review) -->
│  │  │  └─ [_actions.ts](frontend/app/onboarding/tutor-setup/_actions.ts)  <!-- Server actions for transcript upload and profile submission -->
│  │  ├─ [page.tsx](frontend/app/onboarding/page.tsx)  <!-- Role selection onboarding page -->
│  │  └─ [_actions.ts](frontend/app/onboarding/_actions.ts)  <!-- Server actions for role selection -->
│  ├─ sign-in/
│  │  └─ [[...sign-in]]/
│  │     ├─ [page.tsx](frontend/app/sign-in/[[...sign-in]]/page.tsx)  <!-- Custom Clerk sign-in page -->
│  │     └─ [loading.tsx](frontend/app/sign-in/[[...sign-in]]/loading.tsx)  <!-- Sign-in loading state -->
│  ├─ sign-up/
│  │  └─ [[...sign-up]]/
│  │     ├─ [page.tsx](frontend/app/sign-up/[[...sign-up]]/page.tsx)  <!-- Custom Clerk sign-up page -->
│  │     └─ [loading.tsx](frontend/app/sign-up/[[...sign-up]]/loading.tsx)  <!-- Sign-up loading state -->
│  ├─ sign-out/
│  │  └─ [page.tsx](frontend/app/sign-out/page.tsx)  <!-- Sign-out handler -->
│  ├─ [layout.tsx](frontend/app/layout.tsx)  <!-- Root layout with Clerk provider and global styles -->
│  ├─ [page.tsx](frontend/app/page.tsx)  <!-- Landing page -->
│  ├─ [globals.css](frontend/app/globals.css)  <!-- Global styles, Tailwind v4 CSS-first config with @theme block, design tokens -->
│  └─ [favicon.ico](frontend/app/favicon.ico)
├─ components/
│  ├─ auth/
│  │  └─ [AuthShell.tsx](frontend/components/auth/AuthShell.tsx)  <!-- Shared wrapper for custom Clerk auth pages -->
│  ├─ dashboard/
│  │  └─ [DashboardShell.tsx](frontend/components/dashboard/DashboardShell.tsx)  <!-- Shared layout shell for all dashboard pages (sidebar, nav, etc) -->
│  ├─ landing/
│  │  ├─ [Navbar.tsx](frontend/components/landing/Navbar.tsx)  <!-- Navigation bar with auth links -->
│  │  ├─ [Hero.tsx](frontend/components/landing/Hero.tsx)  <!-- Hero section -->
│  │  ├─ [TrustBanner.tsx](frontend/components/landing/TrustBanner.tsx)  <!-- Trust/social proof banner -->
│  │  ├─ [ValueSplit.tsx](frontend/components/landing/ValueSplit.tsx)  <!-- Value proposition sections -->
│  │  ├─ [HowItWorks.tsx](frontend/components/landing/HowItWorks.tsx)  <!-- Product walkthrough -->
│  │  ├─ [TutorCards.tsx](frontend/components/landing/TutorCards.tsx)  <!-- Featured tutor profiles -->
│  │  ├─ [FAQ.tsx](frontend/components/landing/FAQ.tsx)  <!-- Frequently asked questions accordion -->
│  │  └─ [Footer.tsx](frontend/components/landing/Footer.tsx)  <!-- Footer with links -->
│  └─ ui/
│     ├─ [Button.tsx](frontend/components/ui/Button.tsx)  <!-- Reusable button component with variants -->
│     ├─ [Card.tsx](frontend/components/ui/Card.tsx)  <!-- Reusable card component -->
│     ├─ [Badge.tsx](frontend/components/ui/Badge.tsx)  <!-- Reusable badge/tag component -->
│     └─ [Accordion.tsx](frontend/components/ui/Accordion.tsx)  <!-- Reusable accordion component -->
├─ lib/
│  ├─ [button-variants.ts](frontend/lib/button-variants.ts)  <!-- Button style variants (server-safe, used in Server Components) -->
│  ├─ [ClerkAppearance.ts](frontend/lib/ClerkAppearance.ts)  <!-- Clerk UI customization theme -->
│  ├─ [motion.ts](frontend/lib/motion.ts)  <!-- Framer Motion animation presets -->
│  ├─ [Utils.ts](frontend/lib/Utils.ts)  <!-- Utility functions (cn, classname helpers, etc) -->
│  └─ [Data.ts](frontend/lib/Data.ts)  <!-- Static data (subjects list, levels, FAQ data, etc) -->
├─ types/
│  └─ [global.d.ts](frontend/types/global.d.ts)  <!-- Global TypeScript type definitions -->
├─ [layout.tsx](frontend/app/layout.tsx)  <!-- Root app layout -->
├─ [globals.css](frontend/app/globals.css)  <!-- Global styles with design tokens -->
├─ [next.config.ts](frontend/next.config.ts)  <!-- Next.js configuration -->
├─ [tsconfig.json](frontend/tsconfig.json)  <!-- TypeScript configuration -->
├─ [postcss.config.mjs](frontend/postcss.config.mjs)  <!-- PostCSS configuration for Tailwind v4 -->
├─ [eslint.config.mjs](frontend/eslint.config.mjs)  <!-- ESLint configuration -->
├─ [proxy.ts](frontend/proxy.ts)  <!-- Proxy utility for calling internal backend routes -->
├─ [package.json](frontend/package.json)  <!-- Dependencies and scripts -->
└─ [package-lock.json](frontend/package-lock.json)
```
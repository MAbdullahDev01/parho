import type { Appearance } from "@clerk/types";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/Utils";

/**
 * Restyles Clerk's prebuilt <SignIn />/<SignUp /> widgets to match Parho's
 * "verified document" design system.
 *
 * This is intentionally NOT a hand-copied palette:
 *  - `variables` below reference the CSS custom properties defined in
 *    app/globals.css (--color-stamp, --color-carbon, etc.) via var(...),
 *    so editing a color there updates Clerk's widget automatically.
 *  - Buttons reuse `buttonVariants` from components/ui/Button.tsx directly,
 *    so if that component's styling changes, this file doesn't need to be
 *    touched separately.
 *
 * Net result: globals.css + Button.tsx are the only two files that ever
 * need editing to restyle sign-in/sign-up.
 */
export const clerkAppearance: Appearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    logoPlacement: "none",
    showOptionalFields: true,
  },
  variables: {
    colorPrimary: "var(--color-stamp)",
    colorText: "var(--color-carbon)",
    colorTextSecondary: "var(--color-slate)",
    colorBackground: "var(--color-card)",
    colorInputBackground: "var(--color-card)",
    colorInputText: "var(--color-carbon)",
    colorDanger: "var(--color-stamp-deep)",
    colorNeutral: "var(--color-carbon)",
    borderRadius: "0.5rem", // matches rounded-md used across ui/Button + ui/Card
    fontFamily: "var(--font-body), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-body), system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full bg-transparent p-0 shadow-none border-none gap-6",

    header: "gap-1.5",
    headerTitle: "font-display text-2xl font-medium tracking-tight text-carbon",
    headerSubtitle: "text-sm text-slate",

    socialButtonsBlockButton: cn(buttonVariants({ variant: "outline" }), "w-full"),
    socialButtonsBlockButtonText: "text-sm font-medium",
    socialButtonsProviderIcon: "h-4 w-4",

    dividerRow: "my-2",
    dividerLine: "bg-line-light",
    dividerText: "font-mono text-[10px] uppercase tracking-[0.12em] text-slate",

    form: "gap-4",
    formFieldRow: "gap-1.5",
    formFieldLabel: "text-sm font-medium text-carbon",
    formFieldInput:
      "h-11 rounded-md border border-line-light bg-card px-3.5 text-sm text-carbon placeholder:text-slate transition-colors focus:border-stamp focus:outline-none focus:ring-2 focus:ring-stamp/20",
    formFieldInputShowPasswordButton: "text-slate hover:text-carbon",
    formFieldHintText: "text-xs text-slate",
    formFieldErrorText: "text-xs font-medium text-stamp-deep",
    formFieldSuccessText: "text-xs font-medium text-ledger",
    formFieldAction: "text-xs font-semibold text-stamp hover:text-stamp-deep",

    formButtonPrimary: cn(buttonVariants({ variant: "stamp" }), "w-full normal-case"),

    otpCodeFieldInput:
      "rounded-md border border-line-light text-carbon focus:border-stamp focus:ring-2 focus:ring-stamp/20",
    formResendCodeLink: "text-sm font-semibold text-stamp hover:text-stamp-deep",

    identityPreview: "rounded-md border border-line-light bg-page",
    identityPreviewText: "text-sm text-carbon",
    identityPreviewEditButton: "text-stamp hover:text-stamp-deep",

    footer: "bg-transparent",
    footerAction: "text-sm",
    footerActionText: "text-slate",
    footerActionLink: "font-semibold text-stamp hover:text-stamp-deep",

    alert: "rounded-md border border-stamp-50 bg-stamp-50 text-stamp-deep",
    alertText: "text-sm",

    formFieldRadioGroupItem: "accent-stamp",
    checkboxInput: "accent-stamp",
    checkboxLabel: "text-sm text-slate",

    badge: "bg-ledger-50 text-ledger",
    avatarBox: "rounded-full",
  },
};
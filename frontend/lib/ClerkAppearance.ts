import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/Utils";

/**
 * Restyles Clerk's prebuilt <SignIn />/<SignUp /> widgets to match Parho's
 * "verified document" design system.
 *
 * The auth shell owns the outer card. Clerk is rendered as a flush, full-width
 * form inside it so there is only one visual card and no internal overflow.
 */
export const clerkAppearance = {
  options: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    logoPlacement: "none" as const,
    showOptionalFields: true,
    elevation: "flush" as const,
    unsafe_disableDevelopmentModeWarnings: true,
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
    borderRadius: "0.5rem",
    fontFamily: "var(--font-body), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-body), system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    // Explicitly reset Clerk's own sizing/margins. Without these, its internal
    // max-width can make the form appear shifted toward the right edge.
    rootBox: "!mx-0 !w-full !max-w-none min-w-0",
    cardBox: "!mx-0 !w-full !max-w-none min-w-0 shadow-none",
    card: "!mx-0 !w-full !max-w-none min-w-0 bg-transparent p-0 shadow-none border-none gap-6",

    header: "gap-1.5",
    headerTitle: "font-display text-2xl font-medium tracking-tight text-carbon",
    headerSubtitle: "text-sm text-slate",

    socialButtonsBlockButton: cn(
      buttonVariants({ variant: "outline" }),
      "!mx-0 !w-full !max-w-none min-w-0"
    ),
    socialButtonsBlockButtonText: "text-sm font-medium",
    socialButtonsProviderIcon: "h-4 w-4",

    dividerRow: "my-2",
    dividerLine: "bg-line-light",
    dividerText: "font-mono text-[10px] uppercase tracking-[0.12em] text-slate",

    form: "!mx-0 !w-full !max-w-none min-w-0 gap-4",
    formFieldRow: "gap-1.5 min-w-0",
    formFieldLabel: "text-sm font-medium text-carbon",
    formFieldInput:
      "h-11 !w-full !max-w-none min-w-0 rounded-md border border-line-light bg-card px-3.5 text-sm text-carbon placeholder:text-slate transition-colors focus:border-stamp focus:outline-none focus:ring-2 focus:ring-stamp/20",
    formFieldInputShowPasswordButton: "text-slate hover:text-carbon",
    formFieldHintText: "text-xs text-slate",
    formFieldErrorText: "text-xs font-medium text-stamp-deep",
    formFieldSuccessText: "text-xs font-medium text-ledger",
    formFieldAction: "text-xs font-semibold text-stamp hover:text-stamp-deep",

    formButtonPrimary: cn(
      buttonVariants({ variant: "stamp" }),
      "!mx-0 !w-full !max-w-none min-w-0 normal-case"
    ),

    otpCodeFieldInput:
      "rounded-md border border-line-light text-carbon focus:border-stamp focus:ring-2 focus:ring-stamp/20",
    formResendCodeLink: "text-sm font-semibold text-stamp hover:text-stamp-deep",

    identityPreview: "rounded-md border border-line-light bg-page",
    identityPreviewText: "text-sm text-carbon",
    identityPreviewEditButton: "text-stamp hover:text-stamp-deep",

    footer: "bg-transparent p-0",
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

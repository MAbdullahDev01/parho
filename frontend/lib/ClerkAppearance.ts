import type { Appearance } from "@clerk/types";

/**
 * Restyles Clerk's prebuilt <SignIn />/<SignUp /> widgets to match Parho's
 * design system instead of Clerk's default theme. Keep this in sync with
 * the tokens in app/globals.css (colors, radius, fonts) and the variants
 * in components/ui/Button.tsx.
 */
export const clerkAppearance: Appearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    logoPlacement: "none",
    showOptionalFields: true,
  },
  variables: {
    colorPrimary: "#059669", // emerald-600
    colorText: "#0b1120", // ink
    colorTextSecondary: "#64748b", // slate-500
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0b1120",
    colorDanger: "#dc2626",
    colorNeutral: "#0b1120",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-body), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-body), system-ui, sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full bg-transparent p-0 shadow-none border-none gap-6",

    header: "gap-1.5",
    headerTitle: "font-display text-2xl font-semibold tracking-tight text-ink",
    headerSubtitle: "text-sm text-slate-500",

    socialButtonsBlockButton:
      "h-11 rounded-full border border-line bg-white text-sm font-semibold text-ink transition-colors hover:bg-mist",
    socialButtonsBlockButtonText: "text-sm font-semibold",
    socialButtonsProviderIcon: "h-4 w-4",

    dividerRow: "my-2",
    dividerLine: "bg-line",
    dividerText: "text-xs font-medium uppercase tracking-wide text-slate-400",

    form: "gap-4",
    formFieldRow: "gap-1.5",
    formFieldLabel: "text-sm font-medium text-ink",
    formFieldInput:
      "h-11 rounded-xl border border-line bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
    formFieldInputShowPasswordButton: "text-slate-400 hover:text-ink",
    formFieldHintText: "text-xs text-slate-400",
    formFieldErrorText: "text-xs font-medium text-red-600",
    formFieldSuccessText: "text-xs font-medium text-emerald-600",
    formFieldAction: "text-xs font-semibold text-emerald-600 hover:text-emerald-700",

    formButtonPrimary:
      "h-11 rounded-full bg-emerald-600 text-sm font-semibold normal-case text-white shadow-sm transition-colors hover:bg-emerald-700",

    otpCodeFieldInput:
      "rounded-xl border border-line text-ink focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
    formResendCodeLink: "text-sm font-semibold text-emerald-600 hover:text-emerald-700",

    identityPreview: "rounded-xl border border-line bg-mist",
    identityPreviewText: "text-sm text-ink",
    identityPreviewEditButton: "text-emerald-600 hover:text-emerald-700",

    footer: "bg-transparent",
    footerAction: "text-sm",
    footerActionText: "text-slate-500",
    footerActionLink: "font-semibold text-emerald-600 hover:text-emerald-700",

    alert: "rounded-xl border border-red-200 bg-red-50 text-red-700",
    alertText: "text-sm",

    formFieldRadioGroupItem: "accent-emerald-600",
    checkboxInput: "accent-emerald-600",
    checkboxLabel: "text-sm text-slate-600",

    badge: "bg-emerald-50 text-emerald-700",
    avatarBox: "rounded-full",
  },
};
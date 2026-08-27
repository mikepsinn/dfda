export const EMAIL_CONFIG = {
  defaultFrom:
    process.env.EMAIL_FROM ??
    "Crowdsourcing Cures <hello@updates.warondisease.org>",
  domains: {
    main: "updates.warondisease.org",
  },
  addresses: {
    support: process.env.CONTACT_EMAIL ?? "support@dfda.earth",
  },
  retries: {
    max: 3,
    backoff: 1000, // ms
  },
}

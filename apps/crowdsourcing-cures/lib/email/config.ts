export const EMAIL_CONFIG = {
  defaultFrom: "The Decentralized FDA <noreply@dfda.org>",
  domains: {
    main: "dfda.org",
  },
  addresses: {
    support: "support@dfda.org",
    noreply: "noreply@dfda.org",
  },
  retries: {
    max: 3,
    backoff: 1000, // ms
  },
}

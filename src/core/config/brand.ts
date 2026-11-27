export const brandConfig = {
  name: import.meta.env.VITE_APP_NAME ?? 'Alley Randevu',
  shortName: 'Randevu',
  tagline: 'Randevular düzenli, işin akışında.',
  supportEmail: 'destek@alleysoftware.com',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'tr',
  defaultTimezone: import.meta.env.VITE_DEFAULT_TIMEZONE ?? 'Europe/Istanbul'
} as const

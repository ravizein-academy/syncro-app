export const ALLOWED_COMPANY_DOMAINS = ["itsecacademy.com", "itsecasia.com"];

export function isAllowedCompanyEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];

  // Blokir domain email publik secara eksplisit
  const publicDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "mail.com",
    "aol.com",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
    "live.com",
    "msn.com",
  ];
  if (publicDomains.includes(domain)) {
    return false;
  }

  // Hanya izinkan pendaftaran yang menggunakan @itsecacademy.com dan @itsecasia.com
  return ALLOWED_COMPANY_DOMAINS.includes(domain);
}

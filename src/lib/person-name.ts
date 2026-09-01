export const NAME_TITLES = ["นาย", "นาง", "นางสาว"] as const;

export type NameTitle = (typeof NAME_TITLES)[number];

export function isNameTitle(value: unknown): value is NameTitle {
  return typeof value === "string" && NAME_TITLES.includes(value as NameTitle);
}

export function formatBookerName(person: {
  title?: string;
  firstName: string;
  lastName: string;
}): string {
  return [person.title, person.firstName, person.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

export function isTenDigitPhone(value: unknown): boolean {
  return typeof value === "string" && /^\d{10}$/.test(value);
}

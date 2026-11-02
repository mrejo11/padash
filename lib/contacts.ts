const managers = [
  { name: 'مهندس پاداشی', phone: '09112243632' },
  { name: 'مهندس فرجی', phone: '09112286151' },
] as const;

export const businessContacts = managers.map(manager => ({
  ...manager,
  displayPhone: manager.phone.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]),
  href: 'tel:+98' + manager.phone.slice(1),
}));

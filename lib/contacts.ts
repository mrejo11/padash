export const businessContactName = 'مهندس پاداشی';

const phoneLines = [
  { phone: '09112243632', label: 'خط اصلی' },
  { phone: '09117746592', label: 'خط دوم' },
] as const;

export const businessContacts = phoneLines.map(line => {
  const displayPhone = line.phone.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
  return {
    ...line,
    displayPhone,
    href: 'tel:+98' + line.phone.slice(1),
    callLabel: `تماس با ${businessContactName}، ${line.label}، ${displayPhone}`,
  };
});

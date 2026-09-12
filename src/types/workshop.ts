export type Workshop = {
  id: string;
  workshop_code: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  tax_number: string | null;
  active: boolean;
};

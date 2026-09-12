export type Driver = {
  id: string;
  employee_number: string;
  name: string;
  phone: string | null;
  department_id: string | null;
  license_type: string | null;
  license_number: string | null;
  license_expiry: string | null;
  active: boolean;
};

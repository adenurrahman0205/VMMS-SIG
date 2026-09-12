export type RoleName = "SUPER_ADMIN" | "FLEET_ADMIN" | "SUPERVISOR" | "MANAGEMENT" | "DRIVER";

export type Profile = {
  id: string;
  employee_number: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  active: boolean;
};

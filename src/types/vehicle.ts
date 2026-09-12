export type VehicleStatus =
  | "READY"
  | "OPERATIONAL"
  | "WARNING"
  | "MAINTENANCE"
  | "ACCIDENT"
  | "INACTIVE"
  | "SOLD";

export type Vehicle = {
  id: string;
  vehicle_code: string;
  plate_number: string;
  brand: string;
  model: string;
  vehicle_type: string | null;
  year: number | null;
  color: string | null;
  engine_number: string | null;
  chassis_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  initial_odometer: number;
  current_odometer: number;
  status: VehicleStatus;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleAssignment = {
  id: string;
  vehicle_id: string;
  department_id: string;
  driver_id: string | null;
  start_date: string;
  end_date: string | null;
  assignment_type: string | null;
  notes: string | null;
};

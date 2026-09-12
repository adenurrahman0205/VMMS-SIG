export type MaintenanceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MaintenanceType =
  | "SERVICE_BERKALA"
  | "GANTI_OLI"
  | "REM"
  | "BAN"
  | "AC"
  | "MESIN"
  | "TRANSMISI"
  | "ELECTRICAL"
  | "BODY"
  | "ACCIDENT"
  | "OTHER";

export type Maintenance = {
  id: string;
  maintenance_number: string;
  vehicle_id: string;
  maintenance_date: string;
  odometer: number | null;
  maintenance_type: MaintenanceType;
  labor_cost: number;
  parts_cost: number;
  other_cost: number;
  total_cost: number;
  status: MaintenanceStatus;
};

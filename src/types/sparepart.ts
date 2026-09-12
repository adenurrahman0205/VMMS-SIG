export type Sparepart = {
  id: string;
  part_code: string;
  part_name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  default_price: number;
  stock: number;
  minimum_stock: number;
  active: boolean;
};

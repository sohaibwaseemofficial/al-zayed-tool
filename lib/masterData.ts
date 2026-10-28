import { getSupabase } from './supabase';

export interface MasterMaterial {
  id: string;
  description: string;
  defaultUnitPrice: number;
  category?: string;
}

export interface MasterSupplier {
  id: string;
  name: string;
}

export interface MasterClientProject {
  id: string;
  clientName: string;
  projectName: string;
  projectCode?: string;
}

const LOCAL_STORAGE_MATERIALS = 'alzayed_master_materials_v2';
const LOCAL_STORAGE_SUPPLIERS = 'alzayed_master_suppliers_v2';
const LOCAL_STORAGE_CLIENTS = 'alzayed_master_clients_v2';

export const INITIAL_MATERIALS: MasterMaterial[] = [
  { id: 'mat-1', description: 'ANCHOR BOLTS M20X400M length', defaultUnitPrice: 13 },
  { id: 'mat-2', description: 'MS RHS COLUMN 60X60-3MM-6MTR', defaultUnitPrice: 105 },
  { id: 'mat-3', description: 'MS RHS ARCH 60X60-3MM-6MTR', defaultUnitPrice: 105 },
  { id: 'mat-4', description: 'MS SHS TUBE Connector 50X50-3MM-6MTR', defaultUnitPrice: 90 },
  { id: 'mat-5', description: 'MS PLATE 1.2M X 2.4M-10MM', defaultUnitPrice: 810 },
  { id: 'mat-6', description: 'MS PLATE 1.2M X 2.4M-6MM', defaultUnitPrice: 450 },
  { id: 'mat-7', description: 'M16X120 NUT AND BOLTS', defaultUnitPrice: 1.5 },
  { id: 'mat-8', description: 'SELF TAPPING SCREW-BOX', defaultUnitPrice: 50 },
  { id: 'mat-9', description: 'M16X60 NUT AND BOLTS', defaultUnitPrice: 1.5 },
  { id: 'mat-10', description: 'PVC BLACKOUT 650 GSM 2.5X85MTR', defaultUnitPrice: 1438 },
  { id: 'mat-11', description: 'PVC KEDDER', defaultUnitPrice: 5.5 },
  { id: 'mat-12', description: 'Single Channel', defaultUnitPrice: 30 },
  { id: 'mat-13', description: 'Double Channel', defaultUnitPrice: 60 },
  { id: 'mat-14', description: 'Columns- MS PIPE 168.3 mm-THK 5MM-6MTR', defaultUnitPrice: 440 },
  { id: 'mat-15', description: 'Arches- MS PIPE 73.1 mm-THK 3MM-6MTR', defaultUnitPrice: 125 },
  { id: 'mat-16', description: 'Truss Zigzag Pipe- MS PIPE 48.3mm-THK 2MM-6MTR', defaultUnitPrice: 48 },
  { id: 'mat-17', description: 'Connector MS PIPE 60.3mm-THK 3MM-6MTR', defaultUnitPrice: 85 },
  { id: 'mat-18', description: 'HDPE 340 GSM 3X50 Shade Net Roll', defaultUnitPrice: 1550 },
  { id: 'mat-19', description: 'MS PIPE INCH-THK 6inch 5MM-6MTR', defaultUnitPrice: 440 },
  { id: 'mat-20', description: 'D shackle Grade 80 Galvanized', defaultUnitPrice: 8 },
  { id: 'mat-21', description: 'Webbing belt 50mm UV Treated', defaultUnitPrice: 195 },
  { id: 'mat-22', description: '20x60 nuts and bolts Grade 8.8 Hot Dip Galv', defaultUnitPrice: 7 },
  { id: 'mat-23', description: 'Custom Curved Cantilever Shade Arms', defaultUnitPrice: 3100 },
  { id: 'mat-24', description: 'Canopy Support Framing & Anchor Plates', defaultUnitPrice: 2000 },
  { id: 'mat-25', description: 'Heavy Duty Structural Steel Beams & Girders', defaultUnitPrice: 5200 },
  { id: 'mat-26', description: 'Base Plates & Anchor Rods 24mm', defaultUnitPrice: 20 },
];

export const INITIAL_SUPPLIERS: MasterSupplier[] = [
  { id: 'sup-1', name: 'Marhaba' },
  { id: 'sup-2', name: 'First Source' },
  { id: 'sup-3', name: 'Naaji' },
  { id: 'sup-4', name: 'First Source + Marhaba + Al bateen' },
  { id: 'sup-5', name: 'Al Bateen Materials' },
  { id: 'sup-6', name: 'Emirates Steel' },
  { id: 'sup-7', name: 'Danube Building Materials' },
  { id: 'sup-8', name: 'Al Zamil Trading' },
];

export const INITIAL_CLIENT_PROJECTS: MasterClientProject[] = [
  { id: 'cp-1', clientName: 'Al barsha + Inner Space', projectName: 'Al barsha + Inner Space', projectCode: 'AZTS-0007' },
  { id: 'cp-2', clientName: 'Esnad', projectName: 'Esnad Steel Structures & Columns', projectCode: 'AZ-PRJ-001' },
  { id: 'cp-3', clientName: 'Naaji', projectName: 'Naaji Project Car Parks', projectCode: 'AZTS-0008' },
  { id: 'cp-4', clientName: 'Masri Contracting', projectName: 'Forca Warehouse Canopy', projectCode: 'AZTS-0009' },
  { id: 'cp-5', clientName: 'Arabico Steel', projectName: 'Arabico 2nd LPO Shading Project', projectCode: 'AZTS-0006' },
  { id: 'cp-6', clientName: 'Promser', projectName: 'Promser Dubai Exhibition Shades', projectCode: 'AZTS-0013' },
  { id: 'cp-7', clientName: 'Dogma Interiors', projectName: 'Dogma Tensile Canopy', projectCode: 'AZTS-0004' },
  { id: 'cp-8', clientName: 'Zahid', projectName: 'Zahid Steel Carport', projectCode: 'AZTS-0003' },
];

// Local Storage & Supabase Sync Methods
export function getStoredMaterials(): MasterMaterial[] {
  if (typeof window === 'undefined') return INITIAL_MATERIALS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATERIALS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_MATERIALS, JSON.stringify(INITIAL_MATERIALS));
      return INITIAL_MATERIALS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MATERIALS;
  }
}

export function saveStoredMaterials(items: MasterMaterial[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_MATERIALS, JSON.stringify(items));

  // Sync to Supabase `catalog_items` if available
  const client = getSupabase();
  if (client) {
    (async () => {
      try {
        const { error } = await client.from('catalog_items').upsert(
          items.map((m) => ({
            id: m.id,
            description: m.description,
            default_unit_price: m.defaultUnitPrice,
          }))
        );
        if (error) console.warn('Supabase catalog_items sync:', error.message);
      } catch (err: any) {
        console.warn('Supabase catalog_items err:', err?.message);
      }
    })();
  }
}

export function getStoredSuppliers(): MasterSupplier[] {
  if (typeof window === 'undefined') return INITIAL_SUPPLIERS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUPPLIERS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
      return INITIAL_SUPPLIERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SUPPLIERS;
  }
}

export function saveStoredSuppliers(items: MasterSupplier[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_SUPPLIERS, JSON.stringify(items));

  const client = getSupabase();
  if (client) {
    (async () => {
      try {
        const { error } = await client
          .from('suppliers')
          .upsert(items.map((s) => ({ id: s.id, name: s.name })));
        if (error) console.warn('Supabase suppliers sync:', error.message);
      } catch (err: any) {
        console.warn('Supabase suppliers err:', err?.message);
      }
    })();
  }
}

export function getStoredClientProjects(): MasterClientProject[] {
  if (typeof window === 'undefined') return INITIAL_CLIENT_PROJECTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLIENTS);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_CLIENTS, JSON.stringify(INITIAL_CLIENT_PROJECTS));
      return INITIAL_CLIENT_PROJECTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_CLIENT_PROJECTS;
  }
}

export function saveStoredClientProjects(items: MasterClientProject[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_CLIENTS, JSON.stringify(items));

  const client = getSupabase();
  if (client) {
    (async () => {
      try {
        const { error } = await client.from('client_projects').upsert(
          items.map((cp) => ({
            id: cp.id,
            client_name: cp.clientName,
            project_name: cp.projectName,
            project_code: cp.projectCode,
          }))
        );
        if (error) console.warn('Supabase client_projects sync:', error.message);
      } catch (err: any) {
        console.warn('Supabase client_projects err:', err?.message);
      }
    })();
  }
}

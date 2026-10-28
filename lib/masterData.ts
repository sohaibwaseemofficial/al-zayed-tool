export interface MasterMaterial {
  description: string;
  defaultUnitPrice: number;
}

export const MASTER_MATERIALS: MasterMaterial[] = [
  { description: 'ANCHOR BOLTS M20X400M length', defaultUnitPrice: 13 },
  { description: 'MS RHS COLUMN 60X60-3MM-6MTR', defaultUnitPrice: 105 },
  { description: 'MS RHS ARCH 60X60-3MM-6MTR', defaultUnitPrice: 105 },
  { description: 'MS SHS TUBE Connector 50X50-3MM-6MTR', defaultUnitPrice: 90 },
  { description: 'MS PLATE 1.2M X 2.4M-10MM', defaultUnitPrice: 810 },
  { description: 'MS PLATE 1.2M X 2.4M-6MM', defaultUnitPrice: 450 },
  { description: 'M16X120 NUT AND BOLTS', defaultUnitPrice: 1.5 },
  { description: 'SELF TAPPING SCREW-BOX', defaultUnitPrice: 50 },
  { description: 'M16X60 NUT AND BOLTS', defaultUnitPrice: 1.5 },
  { description: 'PVC BLACKOUT 650 GSM 2.5X85MTR', defaultUnitPrice: 1438 },
  { description: 'PVC KEDDER', defaultUnitPrice: 5.5 },
  { description: 'Single Channel', defaultUnitPrice: 30 },
  { description: 'Double Channel', defaultUnitPrice: 60 },
  { description: 'Columns- MS PIPE 168.3 mm-THK 5MM-6MTR', defaultUnitPrice: 440 },
  { description: 'Arches- MS PIPE 73.1 mm-THK 3MM-6MTR', defaultUnitPrice: 125 },
  { description: 'Truss Zigzag Pipe- MS PIPE 48.3mm-THK 2MM-6MTR', defaultUnitPrice: 48 },
  { description: 'Connector MS PIPE 60.3mm-THK 3MM-6MTR', defaultUnitPrice: 85 },
  { description: 'HDPE 340 GSM 3X50 Shade Net Roll', defaultUnitPrice: 1550 },
  { description: 'MS PIPE INCH-THK 6inch 5MM-6MTR', defaultUnitPrice: 440 },
  { description: 'D shackle Grade 80 Galvanized', defaultUnitPrice: 8 },
  { description: 'Webbing belt 50mm UV Treated', defaultUnitPrice: 195 },
  { description: '20x60 nuts and bolts Grade 8.8 Hot Dip Galv', defaultUnitPrice: 7 },
  { description: 'Custom Curved Cantilever Shade Arms', defaultUnitPrice: 3100 },
  { description: 'Canopy Support Framing & Anchor Plates', defaultUnitPrice: 2000 },
  { description: 'Heavy Duty Structural Steel Beams & Girders', defaultUnitPrice: 5200 },
  { description: 'Base Plates & Anchor Rods 24mm', defaultUnitPrice: 20 },
];

export const MASTER_PROJECTS: string[] = [
  'Al barsha + Inner Space',
  'Esnad Steel Structures & Columns',
  'Naaji Project Car Parks',
  'Forca Warehouse Canopy',
  'Arabico 2nd LPO Shading Project',
  'Promser Dubai Exhibition Shades',
  'Al Barsha Villa Shades',
  'Inner Space Commercial Canopy',
  'Zahid Steel Carport',
  'Masri Project',
];

export const MASTER_CLIENTS: string[] = [
  'Al barsha + Inner Space',
  'Dogma Interiors',
  'Esnad',
  'Naaji',
  'Masri Contracting',
  'Arabico Steel',
  'Promser',
  'Zahid',
  'Inner Space + Forca',
];

export const MASTER_SUPPLIERS: string[] = [
  'Marhaba',
  'First Source',
  'Naaji',
  'First Source + Marhaba + Al bateen',
  'Al Bateen Materials',
  'Emirates Steel',
  'Danube Building Materials',
  'Al Zamil Trading',
];

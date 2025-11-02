export type Unit = 'inches' | 'cm';

export type ObstructionType =
  | 'bed'
  | 'cabinet'
  | 'door'
  | 'window'
  | 'tv'
  | 'other';

export type WallMaterial = 'drywall' | 'plaster' | 'concrete' | 'brick';

export type MountingType = 'floating' | 'bracketed' | 'l-bracket';

export type Alignment = 'left' | 'center' | 'right';

export interface WallDimensions {
  width: number;
  height: number;
}

export interface ShelfDimensions {
  width: number;
  depth: number;
  id: string;
  expectedWeight?: number; // in pounds
}

export interface Obstruction {
  id: string;
  type: ObstructionType;
  width: number;
  height: number;
  distanceFromLeft: number;
  distanceFromFloor: number;
}

export interface ShelfPlacement {
  id: string;
  distanceFromLeft: number;
  distanceFromFloor: number;
  width: number;
  depth: number;
  expectedWeight?: number;
}

export interface CalculationResult {
  shelves: ShelfPlacement[];
  verticalSpacing?: number;
  measurements: string[];
  instructions: string[];
}

export interface ProjectSettings {
  unit: Unit;
  wallMaterial: WallMaterial;
  mountingType: MountingType;
  alignment: Alignment;
  studSpacing?: number; // 16 or 24 inches on center
  customStudLocations?: number[]; // custom stud positions from left edge
  enableStudDetection?: boolean;
}

// Material estimate returned by the material calculator
export interface MaterialEstimate {
  brackets: number;
  screws: number;
  anchors: number;
  anchorType: string;
  notes?: string;
  maxWeightCapacity?: number; // in pounds
  safetyFactor?: number;
  perShelf?: PerShelfMaterial[]; // per-shelf breakdown
}

// Options for material calculation
export interface MaterialCalcOptions {
  useStuds?: boolean; // if true, anchors are not required for brackets mounted into studs
  studSpacing?: number; // standard stud spacing (16 or 24 inches)
  studLocations?: number[]; // specific stud locations from left edge
}

// Per-shelf breakdown entry
export interface PerShelfMaterial {
  id: string;
  width: number;
  brackets: number;
  screws: number;
  anchors: number;
  maxWeightCapacity?: number; // in pounds
  bracketSpacing?: number; // in inches
  bracketPositions?: number[]; // distance from left edge of shelf to each bracket center
}

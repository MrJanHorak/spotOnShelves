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
}

// Material estimate returned by the material calculator
export interface MaterialEstimate {
  brackets: number;
  screws: number;
  anchors: number;
  anchorType: string;
  notes?: string;
}

// Options for material calculation
export interface MaterialCalcOptions {
  useStuds?: boolean; // if true, anchors are not required for brackets mounted into studs
}

// Per-shelf breakdown entry
export interface PerShelfMaterial {
  id: string;
  width: number;
  brackets: number;
  screws: number;
  anchors: number;
}

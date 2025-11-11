export type Unit = 'inches' | 'cm';

export type ItemType =
  | 'shelf'
  | 'picture'
  | 'poster'
  | 'mirror'
  | 'tv'
  | 'artpiece';

export type HangingMethod =
  | 'wire'
  | 'sawtooth'
  | 'keyhole'
  | 'french-cleat'
  | 'd-ring'
  | 'bracket';

export type GalleryLayout = 'grid' | 'salon' | 'linear' | 'custom';

export type ItemShape = 'rectangle' | 'square' | 'circle' | 'oval';

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

export interface BaseItem {
  id: string;
  type: ItemType;
  width: number;
  height: number;
  weight?: number; // in pounds
  manualPosition?: {
    distanceFromLeft: number;
    distanceFromFloor: number;
  };
  locked?: boolean; // prevent automatic repositioning
}

export interface ShelfDimensions extends BaseItem {
  type: 'shelf';
  depth: number;
  expectedWeight?: number; // backwards compatibility
}

export interface WallItem extends BaseItem {
  type: 'picture' | 'poster' | 'mirror' | 'tv' | 'artpiece';
  frameDepth?: number;
  hangingMethod?: HangingMethod;
  isFramed?: boolean;
  shape?: ItemShape;
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
  type: ItemType;
  distanceFromLeft: number;
  distanceFromFloor: number;
  width: number;
  height: number;
  depth?: number; // for shelves
  weight?: number;
  expectedWeight?: number; // backwards compatibility
  hangingMethod?: HangingMethod;
  frameDepth?: number;
  isFramed?: boolean;
  shape?: ItemShape;
}

export interface CalculationResult {
  shelves: ShelfPlacement[];
  verticalSpacing?: number;
  measurements: string[];
  instructions: string[];
  hardwareRecommendations?: HardwareRecommendation[];
  galleryLayout?: GalleryLayout;
}

export interface ProjectSettings {
  unit: Unit;
  wallMaterial: WallMaterial;
  mountingType: MountingType;
  alignment: Alignment;
  studSpacing?: number; // 16 or 24 inches on center
  customStudLocations?: number[]; // custom stud positions from left edge
  enableStudDetection?: boolean;
  galleryLayout?: GalleryLayout;
  eyeLevelHeight?: number; // default 57-60 inches for picture center
  autoArrange?: boolean; // enable/disable automatic arrangement
  snapToGrid?: boolean; // snap items to grid for alignment
  gridSize?: number; // grid size in inches (default 1)
  minSpacing?: number; // minimum spacing between items in inches
  // Optional background/photo used behind the wall schematic.
  // Stored as a data URL (compressed) for project persistence.
  backgroundImage?: string;
  // Opacity to render the background image (0 = invisible, 1 = fully opaque)
  backgroundOpacity?: number;
  // Whether to use the uploaded photo as the schematic background. If
  // false the schematic will use the plain generated background.
  useBackgroundPhoto?: boolean;
  // How the background image should be sized relative to the schematic
  // - 'cover' behaves like CSS object-fit: cover and fills the container
  // - 'contain' fits the image wholly inside the container
  // - 'fit-to-wall' scales and crops the image so that the image width
  //    maps to the wall width (useful when the photo is taken front-on)
  backgroundFitMode?: 'cover' | 'contain' | 'fit-to-wall';
  // Manual scaling multiplier for background image when finer control is
  // needed (1 = natural image pixels, values >1 zoom in, <1 zoom out).
  backgroundScale?: number;
  // Wall alignment: position of the wall SVG schematic over the background image
  wallAlignmentX?: number; // X offset in pixels
  wallAlignmentY?: number; // Y offset in pixels
  wallScaleFactor?: number; // Scale multiplier for the wall schematic (1 = default)
}

export interface HardwareRecommendation {
  itemId: string;
  itemType: ItemType;
  weight: number;
  hardware: string;
  anchorType: string;
  screwSize: string;
  quantity: number;
  notes: string[];
  maxWeightCapacity: number;
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

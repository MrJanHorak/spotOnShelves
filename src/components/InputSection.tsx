import { Plus, X, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  WallDimensions,
  ShelfDimensions,
  Obstruction,
  ProjectSettings,
  ObstructionType,
  Unit,
  WallMaterial,
  MountingType,
  Alignment,
  ObstructionStandard,
  WallItem,
  ItemType,
  HangingMethod,
  GalleryLayout,
  ItemShape,
} from '../types';
import { ItemTypeSelector } from './ItemTypeSelector';
import { ItemPositioning } from './ItemPositioning';

interface InputSectionProps {
  wall: WallDimensions;
  shelves: (ShelfDimensions | WallItem)[];
  obstructions: Obstruction[];
  settings: ProjectSettings;
  onWallChange: (wall: WallDimensions) => void;
  onShelvesChange: (shelves: (ShelfDimensions | WallItem)[]) => void;
  onObstructionsChange: (obstructions: Obstruction[]) => void;
  onSettingsChange: (settings: ProjectSettings) => void;
}

const obstructionTypes: { value: ObstructionType; label: string }[] = [
  { value: 'bed', label: 'Bed' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'door', label: 'Door' },
  { value: 'window', label: 'Window' },
  { value: 'tv', label: 'TV' },
  { value: 'outlet', label: 'Outlet' },
  { value: 'switch', label: 'Light Switch' },
  { value: 'plumbing', label: 'Plumbing Zone' },
  { value: 'other', label: 'Other' },
];

const getObstructionStandardLabel = (
  standard: ObstructionStandard,
): string => {
  const labels: Record<ObstructionStandard, string> = {
    us: 'US',
    eu: 'EU',
    uk: 'UK',
    'au-nz': 'AU/NZ',
    jp: 'JP',
  };
  return labels[standard];
};

const getDefaultUnitForStandard = (standard: ObstructionStandard): Unit => {
  return standard === 'us' ? 'inches' : 'cm';
};

type ObstructionPreset = {
  widthIn: number;
  heightIn: number;
  distanceFromLeftIn: number;
  distanceFromFloorIn: number;
};

const obstructionPresets: Record<
  ObstructionStandard,
  Record<ObstructionType, ObstructionPreset>
> = {
  us: {
    bed: {
      widthIn: 60,
      heightIn: 50,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    cabinet: {
      widthIn: 30,
      heightIn: 36,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 36,
    },
    door: {
      widthIn: 36,
      heightIn: 80,
      distanceFromLeftIn: 4,
      distanceFromFloorIn: 0,
    },
    window: {
      widthIn: 36,
      heightIn: 48,
      distanceFromLeftIn: 24,
      distanceFromFloorIn: 36,
    },
    tv: {
      widthIn: 55,
      heightIn: 32,
      distanceFromLeftIn: 20,
      distanceFromFloorIn: 30,
    },
    outlet: {
      widthIn: 2.75,
      heightIn: 4.5,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 12,
    },
    switch: {
      widthIn: 2.75,
      heightIn: 4.5,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 48,
    },
    plumbing: {
      widthIn: 16,
      heightIn: 24,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    other: {
      widthIn: 24,
      heightIn: 24,
      distanceFromLeftIn: 0,
      distanceFromFloorIn: 0,
    },
  },
  eu: {
    bed: {
      widthIn: 63,
      heightIn: 47,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    cabinet: {
      widthIn: 31.5,
      heightIn: 27.6,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 35.4,
    },
    door: {
      widthIn: 35.4,
      heightIn: 82.7,
      distanceFromLeftIn: 4,
      distanceFromFloorIn: 0,
    },
    window: {
      widthIn: 47.2,
      heightIn: 47.2,
      distanceFromLeftIn: 24,
      distanceFromFloorIn: 35.4,
    },
    tv: {
      widthIn: 55,
      heightIn: 32,
      distanceFromLeftIn: 20,
      distanceFromFloorIn: 30,
    },
    outlet: {
      widthIn: 3.15,
      heightIn: 3.15,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 11.8,
    },
    switch: {
      widthIn: 3.15,
      heightIn: 3.15,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 41.3,
    },
    plumbing: {
      widthIn: 15.7,
      heightIn: 23.6,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    other: {
      widthIn: 24,
      heightIn: 24,
      distanceFromLeftIn: 0,
      distanceFromFloorIn: 0,
    },
  },
  uk: {
    bed: {
      widthIn: 60,
      heightIn: 47,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    cabinet: {
      widthIn: 31.5,
      heightIn: 28,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 35,
    },
    door: {
      widthIn: 33,
      heightIn: 78,
      distanceFromLeftIn: 4,
      distanceFromFloorIn: 0,
    },
    window: {
      widthIn: 47,
      heightIn: 47,
      distanceFromLeftIn: 24,
      distanceFromFloorIn: 35,
    },
    tv: {
      widthIn: 55,
      heightIn: 32,
      distanceFromLeftIn: 20,
      distanceFromFloorIn: 30,
    },
    outlet: {
      widthIn: 3.4,
      heightIn: 3.4,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 17.7,
    },
    switch: {
      widthIn: 3.4,
      heightIn: 3.4,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 47.2,
    },
    plumbing: {
      widthIn: 16,
      heightIn: 24,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    other: {
      widthIn: 24,
      heightIn: 24,
      distanceFromLeftIn: 0,
      distanceFromFloorIn: 0,
    },
  },
  'au-nz': {
    bed: {
      widthIn: 60,
      heightIn: 47,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    cabinet: {
      widthIn: 31.5,
      heightIn: 28,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 35,
    },
    door: {
      widthIn: 32,
      heightIn: 80.7,
      distanceFromLeftIn: 4,
      distanceFromFloorIn: 0,
    },
    window: {
      widthIn: 47,
      heightIn: 47,
      distanceFromLeftIn: 24,
      distanceFromFloorIn: 35,
    },
    tv: {
      widthIn: 55,
      heightIn: 32,
      distanceFromLeftIn: 20,
      distanceFromFloorIn: 30,
    },
    outlet: {
      widthIn: 3.5,
      heightIn: 4.7,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 11.8,
    },
    switch: {
      widthIn: 3.5,
      heightIn: 4.7,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 43.3,
    },
    plumbing: {
      widthIn: 16,
      heightIn: 24,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    other: {
      widthIn: 24,
      heightIn: 24,
      distanceFromLeftIn: 0,
      distanceFromFloorIn: 0,
    },
  },
  jp: {
    bed: {
      widthIn: 55,
      heightIn: 45,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    cabinet: {
      widthIn: 30,
      heightIn: 26,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 34,
    },
    door: {
      widthIn: 31.5,
      heightIn: 78.7,
      distanceFromLeftIn: 4,
      distanceFromFloorIn: 0,
    },
    window: {
      widthIn: 36,
      heightIn: 47,
      distanceFromLeftIn: 24,
      distanceFromFloorIn: 35,
    },
    tv: {
      widthIn: 50,
      heightIn: 29,
      distanceFromLeftIn: 20,
      distanceFromFloorIn: 30,
    },
    outlet: {
      widthIn: 2.8,
      heightIn: 4.7,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 11.8,
    },
    switch: {
      widthIn: 2.8,
      heightIn: 4.7,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 43.3,
    },
    plumbing: {
      widthIn: 16,
      heightIn: 24,
      distanceFromLeftIn: 12,
      distanceFromFloorIn: 0,
    },
    other: {
      widthIn: 24,
      heightIn: 24,
      distanceFromLeftIn: 0,
      distanceFromFloorIn: 0,
    },
  },
};

export function InputSection({
  wall,
  shelves,
  obstructions,
  settings,
  onWallChange,
  onShelvesChange,
  onObstructionsChange,
  onSettingsChange,
}: InputSectionProps) {
  // Aligner modal state for manual 4-corner alignment
  const [alignOpen, setAlignOpen] = useState(false);
  const [alignDisplaySize, setAlignDisplaySize] = useState<{
    w: number;
    h: number;
  }>({ w: 0, h: 0 });
  const [alignHandles, setAlignHandles] = useState<
    { x: number; y: number }[] | null
  >(null);
  const [showBackgroundControls, setShowBackgroundControls] = useState(
    Boolean(settings.backgroundImage || settings.useBackgroundPhoto),
  );
  const alignImgRef = useRef<HTMLImageElement | null>(null);
  const draggingHandleRef = useRef<number | null>(null);

  useEffect(() => {
    if (settings.backgroundImage || settings.useBackgroundPhoto) {
      setShowBackgroundControls(true);
    }
  }, [settings.backgroundImage, settings.useBackgroundPhoto]);

  // Open the aligner and initialize handles based on current image
  const openAligner = () => {
    if (!settings.backgroundImage) return;
    const img = new Image();
    img.onload = () => {
      alignImgRef.current = img;
      // Fit image to modal area (max 900px width)
      const maxW = Math.min(900, window.innerWidth - 120);
      const scale = Math.min(1, maxW / img.width);
      const dispW = Math.round(img.width * scale);
      const dispH = Math.round(img.height * scale);
      setAlignDisplaySize({ w: dispW, h: dispH });
      // default handles on corners of displayed image
      setAlignHandles([
        { x: 8, y: 8 },
        { x: dispW - 8, y: 8 },
        { x: dispW - 8, y: dispH - 8 },
        { x: 8, y: dispH - 8 },
      ]);
      setAlignOpen(true);
    };
    img.src = settings.backgroundImage as string;
  };

  // closeAligner removed; use setAlignOpen(false) directly

  // Pointer handlers for dragging alignment handles on the displayed image
  const onAlignPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    idx: number,
  ) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    draggingHandleRef.current = idx;
  };

  const onAlignPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingHandleRef.current === null) return;
    if (!alignHandles || !alignImgRef.current) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setAlignHandles((prev) => {
      if (!prev) return prev;
      const next = prev.map((p) => ({ ...p }));
      next[draggingHandleRef.current as number] = { x, y };
      return next;
    });
  };

  const onAlignPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    draggingHandleRef.current = null;
  };

  // Apply alignment: warp quad into rectangle and save into settings
  const applyAlignment = async () => {
    if (!alignImgRef.current || !alignHandles) return;
    // map displayed coords back to original image coords
    const img = alignImgRef.current;
    const dispW = alignDisplaySize.w || img.width;
    const dispH = alignDisplaySize.h || img.height;
    const scaleX = img.width / dispW;
    const scaleY = img.height / dispH;
    const srcPts = alignHandles.map((p) => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));
    // target rect size: pick reasonable resolution (1200px wide)
    const tw = Math.max(600, Math.min(2000, Math.round(1200)));
    const th = Math.round((wall.height / Math.max(1, wall.width)) * tw);
    const warped = warpQuadToRect(img, srcPts, tw, th);
    if (warped) {
      onSettingsChange({
        ...settings,
        backgroundImage: warped,
        backgroundFitMode: 'cover',
        useBackgroundPhoto: true,
      });
    }
    setAlignOpen(false);
  };

  // Utility: solve 6x6 linear system for affine transform mapping srcTri -> dstTri
  const solveAffine = (
    src: { x: number; y: number }[],
    dst: { x: number; y: number }[],
  ) => {
    // Solve for a,b,c,d,e,f where x' = a*x + b*y + c; y' = d*x + e*y + f
    // Build matrix and solve using Cramer's rule / Gaussian elimination (6x6)
    const A: number[][] = [];
    const B: number[] = [];
    for (let i = 0; i < 3; i++) {
      const sx = src[i].x;
      const sy = src[i].y;
      A.push([sx, sy, 1, 0, 0, 0]);
      B.push(dst[i].x);
      A.push([0, 0, 0, sx, sy, 1]);
      B.push(dst[i].y);
    }
    // Gaussian elimination (6x6)
    const n = 6;
    for (let i = 0; i < n; i++) {
      // find pivot
      let piv = i;
      for (let r = i; r < n; r++) {
        if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r;
      }
      if (piv !== i) {
        [A[i], A[piv]] = [A[piv], A[i]];
        [B[i], B[piv]] = [B[piv], B[i]];
      }
      const ai = A[i][i];
      if (Math.abs(ai) < 1e-12) continue;
      for (let j = i; j < n; j++) A[i][j] /= ai;
      B[i] /= ai;
      for (let r = 0; r < n; r++) {
        if (r === i) continue;
        const factor = A[r][i];
        for (let c = i; c < n; c++) A[r][c] -= factor * A[i][c];
        B[r] -= factor * B[i];
      }
    }
    return B; // [a, b, c, d, e, f]
  };

  // Draw one triangle from src to dst using affine transform
  const drawTriangle = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    srcTri: { x: number; y: number }[],
    dstTri: { x: number; y: number }[],
  ) => {
    // compute affine params
    const [a, b, c, d, e, f] = solveAffine(srcTri, dstTri);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dstTri[0].x, dstTri[0].y);
    ctx.lineTo(dstTri[1].x, dstTri[1].y);
    ctx.lineTo(dstTri[2].x, dstTri[2].y);
    ctx.closePath();
    ctx.clip();
    // setTransform(a, b, c, d, e, f) maps x' = a*x + c*y + e; y' = b*x + d*y + f
    // Our solved form: x' = a*x + b*y + c; y' = d*x + e*y + f
    // So pass (a, d, b, e, c, f) to match canvas ordering
    ctx.setTransform(a, d, b, e, c, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  // Warp the selected quad (srcPts in image pixel coords) into a rectangle of size tw x th
  const warpQuadToRect = (
    img: HTMLImageElement,
    srcPts: { x: number; y: number }[],
    tw: number,
    th: number,
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Destination rectangle corners
    const dst = [
      { x: 0, y: 0 },
      { x: tw, y: 0 },
      { x: tw, y: th },
      { x: 0, y: th },
    ];
    // Triangulate: map src [0,1,2] -> dst [0,1,2] and src [0,2,3] -> dst [0,2,3]
    drawTriangle(
      ctx,
      img,
      [srcPts[0], srcPts[1], srcPts[2]],
      [dst[0], dst[1], dst[2]],
    );
    drawTriangle(
      ctx,
      img,
      [srcPts[0], srcPts[2], srcPts[3]],
      [dst[0], dst[2], dst[3]],
    );
    return canvas.toDataURL('image/jpeg', 0.86);
  };

  const addShelf = () => {
    const newShelf: ShelfDimensions = {
      id: `shelf-${Date.now()}`,
      type: 'shelf',
      width: 24,
      height: 1,
      depth: 8,
    };
    onShelvesChange([...shelves, newShelf]);
  };

  const removeShelf = (id: string) => {
    onShelvesChange(shelves.filter((shelf) => shelf.id !== id));
  };

  const duplicateShelf = (id: string) => {
    const shelfToDuplicate = shelves.find((shelf) => shelf.id === id);
    if (!shelfToDuplicate) return;

    const newShelf = {
      ...shelfToDuplicate,
      id: `shelf-${Date.now()}`,
    };
    onShelvesChange([...shelves, newShelf]);
  };

  const updateShelf = (
    id: string,
    updates: Partial<ShelfDimensions | WallItem>,
  ) => {
    onShelvesChange(
      shelves.map((shelf) => {
        if (shelf.id === id) {
          // Type-safe update based on item type
          if (shelf.type === 'shelf') {
            return { ...shelf, ...updates } as ShelfDimensions;
          } else {
            return { ...shelf, ...updates } as WallItem;
          }
        }
        return shelf;
      }),
    );
  };

  const convertInchesToCurrentUnit = (valueInches: number): number => {
    if (settings.unit === 'cm') {
      return Math.round(valueInches * 2.54 * 10) / 10;
    }
    return Math.round(valueInches * 10) / 10;
  };

  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

  const getObstructionDefaults = (type: ObstructionType): Partial<Obstruction> => {
    const standard = settings.obstructionStandard ?? 'us';
    const preset = obstructionPresets[standard][type];

    const width = convertInchesToCurrentUnit(preset.widthIn);
    const height = convertInchesToCurrentUnit(preset.heightIn);
    const preferredLeft = convertInchesToCurrentUnit(preset.distanceFromLeftIn);
    const preferredFloor = convertInchesToCurrentUnit(preset.distanceFromFloorIn);

    const maxLeft = Math.max(0, wall.width - width);
    const maxFloor = Math.max(0, wall.height - height);

    return {
      type,
      width: Math.min(width, wall.width),
      height: Math.min(height, wall.height),
      distanceFromLeft: clamp(preferredLeft, 0, maxLeft),
      distanceFromFloor: clamp(preferredFloor, 0, maxFloor),
    };
  };

  const addObstruction = () => {
    const defaults = getObstructionDefaults('cabinet');
    const newObstruction: Obstruction = {
      id: `obstruction-${Date.now()}`,
      type: defaults.type ?? 'cabinet',
      width: defaults.width ?? 30,
      height: defaults.height ?? 36,
      distanceFromLeft: defaults.distanceFromLeft ?? 0,
      distanceFromFloor: defaults.distanceFromFloor ?? 0,
    };
    onObstructionsChange([...obstructions, newObstruction]);
  };

  // Compress / resize image on upload to reduce memory and PDF export size.
  // Returns a data URL.
  const resizeImageFile = (file: File, maxWidth = 1600, maxHeight = 1600) =>
    new Promise<string | null>((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          let targetWidth = width;
          let targetHeight = height;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            targetWidth = Math.round(width * scale);
            targetHeight = Math.round(height * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          // Export as JPEG to save size; quality 0.8 is a good tradeoff.
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

  const removeObstruction = (id: string) => {
    onObstructionsChange(
      obstructions.filter((obstruction) => obstruction.id !== id),
    );
  };

  const updateObstruction = (id: string, updates: Partial<Obstruction>) => {
    onObstructionsChange(
      obstructions.map((obstruction) =>
        obstruction.id === id ? { ...obstruction, ...updates } : obstruction,
      ),
    );
  };

  return (
    <div className='space-y-8'>
      {/* Project Settings */}
      <div>
        <h2 className='text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
          <Home className='h-6 w-6 text-blue-600' />
          Project Settings
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Units
            </label>
            <select
              value={settings.unit}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  unit: e.target.value as Unit,
                  autoUnitByStandard: false,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              aria-label='Units'
            >
              <option value='inches'>Inches</option>
              <option value='cm'>Centimeters</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Wall Material
            </label>
            <select
              value={settings.wallMaterial}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  wallMaterial: e.target.value as WallMaterial,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              aria-label='Wall Material'
            >
              <option value='drywall'>Drywall</option>
              <option value='plaster'>Plaster</option>
              <option value='concrete'>Concrete</option>
              <option value='brick'>Brick</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Mounting Type
            </label>
            <select
              value={settings.mountingType}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  mountingType: e.target.value as MountingType,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              aria-label='Mounting Type'
            >
              <option value='floating'>Floating Shelf</option>
              <option value='bracketed'>Bracketed Shelf</option>
              <option value='l-bracket'>L-Bracket</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Alignment
            </label>
            <select
              value={settings.alignment}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  alignment: e.target.value as Alignment,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              aria-label='Alignment'
            >
              <option value='left'>Left Aligned</option>
              <option value='center'>Center Aligned</option>
              <option value='right'>Right Aligned</option>
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Obstruction Standards
            </label>
            <select
              value={settings.obstructionStandard ?? 'us'}
              onChange={(e) => {
                const nextStandard = e.target.value as ObstructionStandard;
                const shouldAutoSyncUnits = settings.autoUnitByStandard ?? true;
                onSettingsChange({
                  ...settings,
                  obstructionStandard: nextStandard,
                  autoUnitByStandard: shouldAutoSyncUnits,
                  unit: shouldAutoSyncUnits
                    ? getDefaultUnitForStandard(nextStandard)
                    : settings.unit,
                });
              }}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              aria-label='Obstruction Standards'
            >
              <option value='us'>US Typical</option>
              <option value='eu'>EU Typical</option>
              <option value='uk'>UK Typical</option>
              <option value='au-nz'>AU/NZ Typical</option>
              <option value='jp'>Japan Typical</option>
            </select>
            <p className='mt-1 text-xs text-gray-600'>
              Units auto-follow this standard until you manually change Units.
            </p>
          </div>
          {/* Background Photo Controls */}
          <div className='md:col-span-2 lg:col-span-5 border border-gray-200 rounded-lg p-3'>
            <button
              type='button'
              onClick={() => setShowBackgroundControls((prev) => !prev)}
              className='w-full flex items-center justify-between text-left'
            >
              <span className='text-sm font-medium text-gray-700'>
                Background Photo (optional)
              </span>
              <span className='text-sm text-blue-700'>
                {showBackgroundControls ? 'Hide' : 'Show'}
              </span>
            </button>

            {showBackgroundControls && (
              <div className='mt-3'>
                <div className='flex items-center gap-2'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await resizeImageFile(file, 1600, 1600);
                      if (dataUrl) {
                        onSettingsChange({
                          ...settings,
                          backgroundImage: dataUrl,
                          backgroundOpacity: settings.backgroundOpacity ?? 0.6,
                          useBackgroundPhoto: true,
                        });
                      } else {
                        onSettingsChange({
                          ...settings,
                          backgroundImage: undefined,
                        });
                      }
                    }}
                    className='text-sm'
                    placeholder='Choose a background photo'
                    title='Upload a background photo of your wall'
                  />
                  {settings.backgroundImage && (
                    <button
                      type='button'
                      onClick={() =>
                        onSettingsChange({
                          ...settings,
                          backgroundImage: undefined,
                          useBackgroundPhoto: false,
                        })
                      }
                      className='px-3 py-1 bg-red-100 text-red-700 rounded'
                    >
                      Remove
                    </button>
                  )}
                  {settings.backgroundImage && (
                    <button
                      type='button'
                      onClick={openAligner}
                      className='px-3 py-1 bg-indigo-100 text-indigo-700 rounded'
                    >
                      Align Wall
                    </button>
                  )}
                </div>
                <div className='flex items-center gap-3 mt-2'>
                  <label className='flex items-center gap-2 text-sm'>
                    <input
                      type='checkbox'
                      checked={settings.useBackgroundPhoto || false}
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          useBackgroundPhoto: e.target.checked,
                        })
                      }
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                    <span>Use photo background</span>
                  </label>
                </div>
                <div className='mt-3 grid grid-cols-1 gap-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Fit Mode
                  </label>
                  <select
                    value={settings.backgroundFitMode || 'cover'}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        backgroundFitMode: e.target.value as
                          | 'cover'
                          | 'contain'
                          | 'fit-to-wall',
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    aria-label='Background Fit Mode'
                  >
                    <option value='cover'>Cover (fill container)</option>
                    <option value='contain'>Contain (fit inside)</option>
                    <option value='fit-to-wall'>Fit-to-wall (map width)</option>
                  </select>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Manual Background Scale
                    </label>
                    <input
                      type='number'
                      value={settings.backgroundScale ?? 1}
                      min={0.1}
                      step={0.05}
                      onChange={(e) =>
                        onSettingsChange({
                          ...settings,
                          backgroundScale: parseFloat(e.target.value) || 1,
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      When using Fit-to-wall, set scale to map the photo to wall
                      measurements. 1 = no zoom.
                    </p>
                  </div>
                </div>
                <div className='mt-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Photo Opacity
                  </label>
                  <input
                    type='range'
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.backgroundOpacity ?? 0.6}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        backgroundOpacity: parseFloat(e.target.value),
                      })
                    }
                    className='w-full'
                  />
                  <div className='text-xs text-gray-500 mt-1'>
                    Adjust how much the photo shows through the schematic.
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Aligner modal */}
          {alignOpen && alignHandles && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
              <div className='bg-white rounded-lg shadow-lg p-4 max-w-[960px] w-full'>
                <h3 className='text-lg font-semibold mb-3'>Align Wall Photo</h3>
                <div
                  className='relative bg-gray-100 mx-auto'
                  style={{
                    width: alignDisplaySize.w,
                    height: alignDisplaySize.h,
                  }}
                  onPointerMove={onAlignPointerMove}
                  onPointerUp={onAlignPointerUp}
                >
                  <img
                    src={settings.backgroundImage as string}
                    alt='Align preview'
                    style={{
                      width: alignDisplaySize.w,
                      height: alignDisplaySize.h,
                      display: 'block',
                    }}
                    draggable={false}
                  />
                  {/* corner handles */}
                  {alignHandles.map((p, i) => (
                    <div
                      key={i}
                      role='slider'
                      aria-label={`Corner ${i + 1}`}
                      onPointerDown={(e) => onAlignPointerDown(e, i)}
                      style={{
                        position: 'absolute',
                        left: p.x - 8,
                        top: p.y - 8,
                        width: 16,
                        height: 16,
                        background: 'white',
                        border: '2px solid rgba(59,130,246,0.9)',
                        borderRadius: 4,
                        touchAction: 'none',
                        cursor: 'move',
                      }}
                    />
                  ))}
                </div>
                <div className='mt-3 flex justify-end gap-2'>
                  <button
                    onClick={() => setAlignOpen(false)}
                    className='px-3 py-2 rounded bg-gray-100'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyAlignment}
                    className='px-3 py-2 rounded bg-indigo-600 text-white'
                  >
                    Apply Alignment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Positioning Controls */}
        <div className='mt-4 border-t pt-4'>
          <h4 className='text-sm font-semibold text-gray-900 mb-3'>
            Positioning Options
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='auto-arrange'
                checked={settings.autoArrange ?? true}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    autoArrange: e.target.checked,
                  })
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label
                htmlFor='auto-arrange'
                className='text-sm font-medium text-gray-700'
              >
                Auto-arrange items
              </label>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='snap-to-grid'
                checked={settings.snapToGrid ?? true}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    snapToGrid: e.target.checked,
                  })
                }
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label
                htmlFor='snap-to-grid'
                className='text-sm font-medium text-gray-700'
              >
                Snap to grid
              </label>
            </div>

            {settings.snapToGrid && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Grid Size ({settings.unit === 'inches' ? 'in' : 'cm'})
                </label>
                <input
                  type='number'
                  value={settings.gridSize ?? 1}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      gridSize: parseFloat(e.target.value) || 1,
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  min='0.25'
                  step='0.25'
                  placeholder='Enter grid size'
                  title='Grid Size'
                />
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Minimum Spacing ({settings.unit === 'inches' ? 'in' : 'cm'})
              </label>
              <div className='flex gap-2'>
                <input
                  type='number'
                  value={settings.minSpacing ?? 2}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      minSpacing: parseFloat(e.target.value) || 2,
                    })
                  }
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  min='0'
                  step='0.5'
                  placeholder='Enter minimum spacing'
                  title='Minimum spacing between items'
                />
                {settings.galleryLayout === 'grid' &&
                  shelves.some((item) => item.type !== 'shelf') && (
                    <button
                      onClick={() => {
                        const wallItems = shelves.filter(
                          (item) => item.type !== 'shelf',
                        );
                        if (wallItems.length === 0) return;

                        // Calculate grid dimensions
                        const cols = Math.ceil(Math.sqrt(wallItems.length));
                        const rows = Math.ceil(wallItems.length / cols);

                        // Get max item dimensions
                        const maxWidth = Math.max(
                          ...wallItems.map((item) => item.width),
                        );
                        const maxHeight = Math.max(
                          ...wallItems.map((item) => item.height),
                        );

                        // Find available horizontal space considering obstructions
                        const sortedObs = [...obstructions].sort(
                          (a, b) => a.distanceFromLeft - b.distanceFromLeft,
                        );

                        const horizontalZones: Array<{
                          start: number;
                          end: number;
                        }> = [];
                        const margin = 4;

                        let currentX = margin;
                        for (const obs of sortedObs) {
                          // Add zone before this obstruction if there's space
                          if (currentX < obs.distanceFromLeft - margin) {
                            horizontalZones.push({
                              start: currentX,
                              end: obs.distanceFromLeft - margin,
                            });
                          }
                          // Move past this obstruction
                          currentX = Math.max(
                            currentX,
                            obs.distanceFromLeft + obs.width + margin,
                          );
                        }

                        // Add final zone if there's remaining space
                        if (currentX < wall.width - margin) {
                          horizontalZones.push({
                            start: currentX,
                            end: wall.width - margin,
                          });
                        }

                        // If no obstructions, use the full width
                        if (horizontalZones.length === 0) {
                          horizontalZones.push({
                            start: margin,
                            end: wall.width - margin,
                          });
                        }

                        // Find the widest zone
                        let bestZone = horizontalZones[0];
                        for (const zone of horizontalZones) {
                          if (
                            zone.end - zone.start >
                            bestZone.end - bestZone.start
                          ) {
                            bestZone = zone;
                          }
                        }

                        // Calculate available space in the best zone
                        const availableWidth = bestZone.end - bestZone.start;
                        const availableHeight = wall.height - 2 * margin;

                        // Calculate total space needed for items
                        const totalItemWidth = cols * maxWidth;
                        const totalItemHeight = rows * maxHeight;

                        // Calculate spacing
                        const horizontalSpacing =
                          cols > 1
                            ? (availableWidth - totalItemWidth) / (cols - 1)
                            : 0;
                        const verticalSpacing =
                          rows > 1
                            ? (availableHeight - totalItemHeight) / (rows - 1)
                            : 0;

                        // Use the smaller of the two to maintain proportional spacing
                        const optimalSpacing = Math.max(
                          0,
                          Math.min(horizontalSpacing, verticalSpacing),
                        );

                        onSettingsChange({
                          ...settings,
                          minSpacing: Math.round(optimalSpacing * 10) / 10,
                        });
                      }}
                      className='px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium whitespace-nowrap'
                      title='Auto-calculate spacing to fit items evenly in available wall space'
                    >
                      Auto
                    </button>
                  )}
              </div>
              {settings.galleryLayout === 'grid' &&
                shelves.some((item) => item.type !== 'shelf') && (
                  <p className='text-xs text-blue-700 mt-2 p-2 bg-blue-50 rounded border border-blue-200'>
                    <strong>💡 Smart Layout:</strong> Click "Auto" to calculate
                    ideal spacing that avoids obstructions (like doors) and fits
                    items evenly in the available space between them.
                  </p>
                )}
            </div>

            {/* Advanced: Separate Horizontal/Vertical Spacing */}
            {settings.galleryLayout === 'grid' &&
              shelves.some((item) => item.type !== 'shelf') && (
                <div className='mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <input
                      type='checkbox'
                      id='separate-spacing'
                      checked={Boolean(
                        settings.horizontalSpacing || settings.verticalSpacing,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSettingsChange({
                            ...settings,
                            horizontalSpacing: settings.minSpacing ?? 6,
                            verticalSpacing: settings.minSpacing ?? 6,
                          });
                        } else {
                          const {
                            horizontalSpacing,
                            verticalSpacing,
                            ...rest
                          } = settings;
                          onSettingsChange(rest);
                        }
                      }}
                      className='h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded'
                    />
                    <label
                      htmlFor='separate-spacing'
                      className='text-sm font-medium text-gray-700'
                    >
                      Fine-tune spacing
                    </label>
                  </div>

                  {(settings.horizontalSpacing || settings.verticalSpacing) && (
                    <div className='grid grid-cols-2 gap-3 mt-3'>
                      <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>
                          Horizontal Gap (
                          {settings.unit === 'inches' ? 'in' : 'cm'})
                        </label>
                        <input
                          type='number'
                          value={settings.horizontalSpacing ?? 6}
                          onChange={(e) =>
                            onSettingsChange({
                              ...settings,
                              horizontalSpacing:
                                parseFloat(e.target.value) || 6,
                            })
                          }
                          className='w-full px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                          min='0'
                          step='0.5'
                          placeholder='Enter horizontal gap'
                          title='Horizontal Gap'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-medium text-gray-700 mb-1'>
                          Vertical Gap (
                          {settings.unit === 'inches' ? 'in' : 'cm'})
                        </label>
                        <input
                          type='number'
                          value={settings.verticalSpacing ?? 6}
                          onChange={(e) =>
                            onSettingsChange({
                              ...settings,
                              verticalSpacing: parseFloat(e.target.value) || 6,
                            })
                          }
                          className='w-full px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                          min='0'
                          step='0.5'
                        />
                      </div>
                    </div>
                  )}
                  <p className='text-xs text-gray-600 mt-2'>
                    Enable to independently adjust horizontal and vertical
                    spacing between items
                  </p>
                </div>
              )}

            {/* Grid Distribution Mode */}
            {settings.galleryLayout === 'grid' &&
              shelves.some((item) => item.type !== 'shelf') && (
                <div className='mt-4 p-3 bg-white rounded border border-green-200'>
                  <label className='block text-sm font-medium text-gray-700 mb-3'>
                    Grid Distribution
                  </label>
                  <div className='space-y-2'>
                    <div className='flex items-start'>
                      <input
                        type='radio'
                        id='dist-centered'
                        name='grid-distribution'
                        checked={!(settings.gridDistributeEvenly ?? false)}
                        onChange={() =>
                          onSettingsChange({
                            ...settings,
                            gridDistributeEvenly: false,
                          })
                        }
                        className='h-4 w-4 text-green-600 mt-0.5'
                      />
                      <label
                        htmlFor='dist-centered'
                        className='ml-2 text-sm text-gray-700'
                      >
                        <span className='font-medium'>📍 Centered</span>
                        <span className='text-xs text-gray-600 block'>
                          Grid centered on wall (larger margins on left/right
                          edges)
                        </span>
                      </label>
                    </div>
                    <div className='flex items-start'>
                      <input
                        type='radio'
                        id='dist-even'
                        name='grid-distribution'
                        checked={settings.gridDistributeEvenly ?? false}
                        onChange={() =>
                          onSettingsChange({
                            ...settings,
                            gridDistributeEvenly: true,
                          })
                        }
                        className='h-4 w-4 text-green-600 mt-0.5'
                      />
                      <label
                        htmlFor='dist-even'
                        className='ml-2 text-sm text-gray-700'
                      >
                        <span className='font-medium'>📊 Distributed</span>
                        <span className='text-xs text-gray-600 block'>
                          Items spread evenly across wall width with equal gaps
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Stud Detection Settings */}
        <div className='mt-4 border-t pt-4'>
          <div className='flex items-center gap-2 mb-3'>
            <input
              type='checkbox'
              id='enable-stud-detection'
              checked={settings.enableStudDetection || false}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  enableStudDetection: e.target.checked,
                })
              }
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
            <label
              htmlFor='enable-stud-detection'
              className='text-sm font-medium text-gray-700'
            >
              Estimate Stud Positions & Visualization
            </label>
          </div>

          {settings.enableStudDetection && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 p-4 bg-blue-50 rounded-lg'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Standard Stud Spacing (
                  {settings.unit === 'inches' ? 'in' : 'cm'})
                </label>
                <select
                  value={settings.studSpacing ?? (settings.unit === 'cm' ? 40.6 : 16)}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      studSpacing: parseFloat(e.target.value),
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  aria-label='Standard Stud Spacing'
                  title='Standard Stud Spacing'
                >
                  {settings.unit === 'cm' ? (
                    <>
                      <option value='40.6'>40.6 cm on center (16")</option>
                      <option value='61'>61 cm on center (24")</option>
                    </>
                  ) : (
                    <>
                      <option value='16'>16" on center (standard)</option>
                      <option value='24'>24" on center</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  First Stud Offset ({settings.unit === 'inches' ? 'in' : 'cm'})
                </label>
                <input
                  type='number'
                  value={
                    settings.firstStudOffset ??
                    settings.studSpacing ??
                    (settings.unit === 'cm' ? 40.6 : 16)
                  }
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      firstStudOffset: parseFloat(e.target.value) || 0,
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  min='0'
                  step='0.5'
                  placeholder={settings.unit === 'cm' ? 'e.g., 40.6' : 'e.g., 16'}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Custom Stud Locations (comma-separated, from left)
                </label>
                <input
                  type='text'
                  value={(settings.customStudLocations || []).join(', ')}
                  onChange={(e) => {
                    const values = e.target.value
                      .split(',')
                      .map((v) => parseFloat(v.trim()))
                      .filter((v) => !isNaN(v));
                    onSettingsChange({
                      ...settings,
                      customStudLocations:
                        values.length > 0 ? values : undefined,
                    });
                  }}
                  placeholder='e.g., 16, 32, 48, 64'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <div className='md:col-span-3 text-xs text-gray-600'>
                <strong>Tip:</strong> Use a stud finder to locate exact stud
                positions and enter them above. If you only estimate, set
                spacing + first offset to match your wall.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wall Dimensions */}
      <div>
        <h3 className='text-xl font-semibold text-gray-900 mb-4'>
          Wall Dimensions
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Width ({settings.unit === 'inches' ? 'in' : 'cm'})
            </label>
            <input
              type='number'
              value={wall.width}
              onChange={(e) =>
                onWallChange({
                  ...wall,
                  width: parseFloat(e.target.value) || 0,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Enter wall width'
              min='0'
              step='0.1'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Height ({settings.unit === 'inches' ? 'in' : 'cm'})
            </label>
            <input
              type='number'
              value={wall.height}
              onChange={(e) =>
                onWallChange({
                  ...wall,
                  height: parseFloat(e.target.value) || 0,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Enter wall height'
              min='0'
              step='0.1'
            />
          </div>
        </div>
      </div>

      {/* Items Section (Shelves and Wall Items) */}
      <div>
        <div className='mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>Items to Hang</h3>
          {shelves.length > 0 && (
            <p className='text-sm text-gray-600 mt-1'>
              {shelves.length} item{shelves.length !== 1 ? 's' : ''} added
            </p>
          )}
        </div>
        <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3'>
          <p className='text-sm text-amber-900'>
            <strong>Safety check:</strong> Add outlets, switches, and plumbing
            zones as obstructions before drilling to reduce wire/pipe strike
            risk.
          </p>
          <p className='text-xs text-amber-800 mt-1'>
            New/updated obstruction types use{' '}
            {getObstructionStandardLabel(settings.obstructionStandard ?? 'us')}{' '}
            typical
            default sizes and placement heights.
          </p>
        </div>
        <div className='space-y-4'>
          {shelves.map((item, index) => (
            <div
              key={item.id}
              className='border border-gray-200 rounded-lg p-4'
            >
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}{' '}
                  {index + 1}
                </h4>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => duplicateShelf(item.id)}
                    className='text-blue-600 hover:text-blue-800 transition-colors p-2 rounded hover:bg-blue-50'
                    title='Duplicate this item with same settings'
                  >
                    <svg
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeShelf(item.id)}
                    className='text-red-600 hover:text-red-800 transition-colors p-2 rounded hover:bg-red-50'
                    title='Remove this item'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              </div>

              {/* Item Type Selector */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Item Type
                </label>
                <ItemTypeSelector
                  selectedType={item.type}
                  onTypeChange={(newType: ItemType) => {
                    // Create a new item of the selected type
                    if (newType === 'shelf') {
                      updateShelf(item.id, {
                        type: 'shelf',
                        depth: 8,
                        height: 1,
                      });
                    } else if (newType === 'tv') {
                      updateShelf(item.id, {
                        type: newType,
                        height: 24,
                        hangingMethod: 'bracket',
                      });
                    } else if (newType === 'mirror') {
                      updateShelf(item.id, {
                        type: newType,
                        height: 24,
                        hangingMethod: 'wire',
                        shape: 'rectangle',
                      });
                    } else {
                      updateShelf(item.id, {
                        type: newType,
                        height: 24,
                        hangingMethod: 'wire',
                      });
                    }
                  }}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {item.type === 'mirror' &&
                    ((item as WallItem).shape === 'circle' ||
                      (item as WallItem).shape === 'square')
                      ? 'Diameter / Size'
                      : 'Width'}{' '}
                    ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type='number'
                    value={item.width}
                    onChange={(e) => {
                      const newWidth = parseFloat(e.target.value) || 0;
                      // For circles and squares, sync width and height
                      if (
                        item.type === 'mirror' &&
                        ((item as WallItem).shape === 'circle' ||
                          (item as WallItem).shape === 'square')
                      ) {
                        updateShelf(item.id, {
                          width: newWidth,
                          height: newWidth,
                        });
                      } else {
                        updateShelf(item.id, {
                          width: newWidth,
                        });
                      }
                    }}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='0'
                    step='0.1'
                  />
                  {item.type === 'mirror' &&
                    ((item as WallItem).shape === 'circle' ||
                      (item as WallItem).shape === 'square') && (
                      <p className='text-xs text-blue-600 mt-1'>
                        {(item as WallItem).shape === 'circle'
                          ? '⭕ Width and height are locked for circles'
                          : '⬜ Width and height are locked for squares'}
                      </p>
                    )}
                </div>

                {item.type === 'shelf' ? (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Depth ({settings.unit === 'inches' ? 'in' : 'cm'})
                    </label>
                    <input
                      type='number'
                      value={(item as ShelfDimensions).depth}
                      onChange={(e) =>
                        updateShelf(item.id, {
                          depth: parseFloat(e.target.value) || 0,
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      min='0'
                      step='0.1'
                    />
                  </div>
                ) : (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Height ({settings.unit === 'inches' ? 'in' : 'cm'})
                    </label>
                    <input
                      type='number'
                      value={item.height}
                      onChange={(e) => {
                        const newHeight = parseFloat(e.target.value) || 0;
                        // For circles and squares, sync width and height
                        if (
                          item.type === 'mirror' &&
                          ((item as WallItem).shape === 'circle' ||
                            (item as WallItem).shape === 'square')
                        ) {
                          updateShelf(item.id, {
                            width: newHeight,
                            height: newHeight,
                          });
                        } else {
                          updateShelf(item.id, {
                            height: newHeight,
                          });
                        }
                      }}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      min='0'
                      step='0.1'
                      disabled={
                        item.type === 'mirror' &&
                        ((item as WallItem).shape === 'circle' ||
                          (item as WallItem).shape === 'square')
                      }
                    />
                    {item.type === 'mirror' &&
                      ((item as WallItem).shape === 'circle' ||
                        (item as WallItem).shape === 'square') && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Locked to match width
                        </p>
                      )}
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    {item.type === 'shelf'
                      ? 'Expected Weight (lbs)'
                      : 'Weight (lbs)'}
                  </label>
                  <input
                    type='number'
                    value={
                      item.type === 'shelf'
                        ? (item as ShelfDimensions).expectedWeight || ''
                        : (item as WallItem).weight || ''
                    }
                    onChange={(e) =>
                      updateShelf(
                        item.id,
                        item.type === 'shelf'
                          ? {
                              expectedWeight:
                                parseFloat(e.target.value) || undefined,
                            }
                          : { weight: parseFloat(e.target.value) || undefined },
                      )
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder={
                      item.type === 'shelf'
                        ? 'Expected weight'
                        : 'Actual weight'
                    }
                    min='0'
                    step='1'
                  />
                </div>

                {item.type !== 'shelf' && (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Hanging Method
                      </label>
                      <select
                        value={
                          (item as WallItem).hangingMethod ||
                          (item.type === 'tv' ? 'bracket' : 'wire')
                        }
                        onChange={(e) =>
                          updateShelf(item.id, {
                            hangingMethod: e.target.value as HangingMethod,
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        aria-label='Hanging Method'
                        title='Hanging Method'
                      >
                        {item.type === 'tv' ? (
                          <>
                            <option value='bracket'>Bracket</option>
                            <option value='french-cleat'>French Cleat</option>
                            <option value='keyhole'>Keyhole</option>
                          </>
                        ) : (
                          <>
                            <option value='wire'>Wire</option>
                            <option value='sawtooth'>Sawtooth Hanger</option>
                            <option value='keyhole'>Keyhole</option>
                            <option value='french-cleat'>French Cleat</option>
                            <option value='d-ring'>D-Ring</option>
                            <option value='bracket'>Bracket</option>
                          </>
                        )}
                      </select>
                    </div>

                    {item.type === 'mirror' && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Mirror Shape
                        </label>
                        <select
                          value={(item as WallItem).shape || 'rectangle'}
                          onChange={(e) => {
                            const newShape = e.target.value as ItemShape;
                            // When changing to circle or square, sync dimensions
                            if (
                              newShape === 'circle' ||
                              newShape === 'square'
                            ) {
                              // Use the larger of width/height to avoid shrinking
                              const size = Math.max(item.width, item.height);
                              updateShelf(item.id, {
                                shape: newShape,
                                width: size,
                                height: size,
                              });
                            } else {
                              updateShelf(item.id, {
                                shape: newShape,
                              });
                            }
                          }}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        >
                          <option value='rectangle'>Rectangle</option>
                          <option value='square'>Square</option>
                          <option value='circle'>Circle / Round</option>
                          <option value='oval'>Oval</option>
                        </select>
                        {((item as WallItem).shape === 'circle' ||
                          (item as WallItem).shape === 'square') && (
                          <p className='text-xs text-blue-600 mt-1'>
                            💡 Dimensions are automatically synced for{' '}
                            {(item as WallItem).shape === 'circle'
                              ? 'circles'
                              : 'squares'}
                          </p>
                        )}
                      </div>
                    )}

                    {item.type === 'picture' && (
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          id={`framed-${item.id}`}
                          checked={(item as WallItem).isFramed || false}
                          onChange={(e) =>
                            updateShelf(item.id, {
                              isFramed: e.target.checked,
                            })
                          }
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                        />
                        <label
                          htmlFor={`framed-${item.id}`}
                          className='text-sm font-medium text-gray-700'
                        >
                          Framed
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Manual Positioning Controls */}
              <ItemPositioning
                item={item}
                index={index}
                wallWidth={wall.width}
                wallHeight={wall.height}
                unit={settings.unit}
                autoArrange={settings.autoArrange ?? true}
                snapToGrid={settings.snapToGrid ?? true}
                gridSize={settings.gridSize ?? 1}
                onUpdate={(id, updates) => updateShelf(id, updates)}
              />
            </div>
          ))}
          {shelves.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              No items added yet. Click "Add Item" to get started.
            </div>
          )}
        </div>

        {/* Add Item Button - Positioned at Bottom */}
        <button
          onClick={addShelf}
          className='mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
        >
          <Plus className='h-5 w-5' />
          Add Item
        </button>

        {/* Gallery Layout Settings */}
        {shelves.some((item) => item.type !== 'shelf') && (
          <div className='mt-6 p-4 bg-purple-50 rounded-lg'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Gallery Layout Pattern
            </label>
            <select
              value={settings.galleryLayout || 'custom'}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  galleryLayout: e.target.value as GalleryLayout,
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              aria-label='Gallery Layout Pattern'
              title='Gallery Layout Pattern'
            >
              <option value='custom'>Custom (User Positioned)</option>
              <option value='grid'>Grid Layout</option>
              <option value='salon'>Salon Style</option>
              <option value='linear'>Linear (Single Row)</option>
            </select>

            {/* Layout Descriptions */}
            <div className='mt-3 p-3 bg-white rounded border border-purple-200'>
              <p className='text-xs font-semibold text-purple-900 mb-2'>
                {settings.galleryLayout === 'grid' && '📊 Grid Layout'}
                {settings.galleryLayout === 'salon' && '🎨 Salon Style'}
                {settings.galleryLayout === 'linear' && '➡️ Linear Layout'}
                {(!settings.galleryLayout ||
                  settings.galleryLayout === 'custom') &&
                  '✏️ Custom Layout'}
              </p>
              <p className='text-xs text-gray-700'>
                {settings.galleryLayout === 'grid' &&
                  'Items arranged in evenly-spaced rows and columns, centered around eye level. Perfect for uniform collections or photo galleries.'}
                {settings.galleryLayout === 'salon' &&
                  'Largest piece at eye level center, others clustered organically around it. Classic museum/gallery style for varied sizes.'}
                {settings.galleryLayout === 'linear' &&
                  'All items in a single horizontal row at eye level. Great for hallways or above furniture.'}
                {(!settings.galleryLayout ||
                  settings.galleryLayout === 'custom') &&
                  'Manually position each item using the Position Controls below. Use eye level as a reference guide.'}
              </p>
            </div>

            <div className='mt-3'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Eye Level Height ({settings.unit === 'inches' ? 'in' : 'cm'}) -
                Center of artwork
              </label>
              <input
                type='number'
                value={settings.eyeLevelHeight ?? (settings.unit === 'cm' ? 144.8 : 57)}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    eyeLevelHeight:
                      parseFloat(e.target.value) ||
                      (settings.unit === 'cm' ? 144.8 : 57),
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder={
                  settings.unit === 'cm' ? 'Standard is 145 cm' : 'Standard is 57"'
                }
                title='Set the eye level height (center of artwork)'
                min={settings.unit === 'cm' ? '100' : '40'}
                max={settings.unit === 'cm' ? '183' : '72'}
                step='1'
              />
              <p className='text-xs text-gray-600 mt-1'>
                {settings.galleryLayout === 'grid' ||
                settings.galleryLayout === 'salon' ||
                settings.galleryLayout === 'linear'
                  ? 'Used as the vertical center point for the layout'
                  : 'Standard gallery height is 57-60 inches from floor to center'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Obstructions */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>
            Wall Obstructions
          </h3>
          <button
            onClick={addObstruction}
            className='flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors'
          >
            <Plus className='h-4 w-4' />
            Add Obstruction
          </button>
        </div>
        <div className='space-y-4'>
          {obstructions.map((obstruction, index) => (
            <div
              key={obstruction.id}
              className='border border-gray-200 rounded-lg p-4'
            >
              <div className='flex items-center justify-between mb-3'>
                <h4 className='font-medium text-gray-900'>
                  {obstruction.type.charAt(0).toUpperCase() +
                    obstruction.type.slice(1)}{' '}
                  {index + 1}
                </h4>
                <button
                  onClick={() => removeObstruction(obstruction.id)}
                  className='text-red-600 hover:text-red-800 transition-colors'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className='lg:col-span-3'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Type
                  </label>
                  <select
                    value={obstruction.type}
                    onChange={(e) => {
                      const nextType = e.target.value as ObstructionType;
                      updateObstruction(
                        obstruction.id,
                        getObstructionDefaults(nextType),
                      );
                    }}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    {obstructionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    onClick={() =>
                      updateObstruction(
                        obstruction.id,
                        getObstructionDefaults(obstruction.type),
                      )
                    }
                    className='mt-2 text-xs text-blue-700 hover:text-blue-900 underline'
                  >
                    Apply{' '}
                    {getObstructionStandardLabel(
                      settings.obstructionStandard ?? 'us',
                    )}{' '}
                    standard preset
                  </button>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Width ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type='number'
                    value={obstruction.width}
                    onChange={(e) =>
                      updateObstruction(obstruction.id, {
                        width: parseFloat(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='0'
                    step='0.1'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Height ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type='number'
                    value={obstruction.height}
                    onChange={(e) =>
                      updateObstruction(obstruction.id, {
                        height: parseFloat(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='0'
                    step='0.1'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Distance from Left (
                    {settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type='number'
                    value={obstruction.distanceFromLeft}
                    onChange={(e) =>
                      updateObstruction(obstruction.id, {
                        distanceFromLeft: parseFloat(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='0'
                    step='0.1'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Distance from Floor (
                    {settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type='number'
                    value={obstruction.distanceFromFloor}
                    onChange={(e) =>
                      updateObstruction(obstruction.id, {
                        distanceFromFloor: parseFloat(e.target.value) || 0,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    min='0'
                    step='0.1'
                    placeholder='Enter distance from floor'
                    title='Distance from floor'
                  />
                </div>
              </div>
            </div>
          ))}
          {obstructions.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              No obstructions added. Your wall is clear!
            </div>
          )}
          {obstructions.length > 0 &&
            !obstructions.some((o) =>
              ['outlet', 'switch', 'plumbing'].includes(o.type),
            ) && (
              <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
                You have no electrical/plumbing obstructions marked yet.
                Confirm outlet, switch, and pipe zones before drilling.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

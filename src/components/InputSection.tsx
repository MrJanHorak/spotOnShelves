import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';
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
} from '../types';
import { WallDimensionsSection } from './input/WallDimensionsSection';
import { ObstructionsSection } from './input/ObstructionsSection';
import { ItemsSection } from './input/ItemsSection';
import { PositioningControlsSection } from './input/PositioningControlsSection';
import { useBackgroundAligner } from './input/useBackgroundAligner';
import {
  getDefaultUnitForStandard,
  obstructionPresets,
} from '../utils/obstructionStandards';

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
  const [showBackgroundControls, setShowBackgroundControls] = useState(
    Boolean(settings.backgroundImage || settings.useBackgroundPhoto),
  );
  const {
    alignOpen,
    alignDisplaySize,
    alignHandles,
    setAlignOpen,
    openAligner,
    onAlignPointerDown,
    onAlignPointerMove,
    onAlignPointerUp,
    applyAlignment,
    resizeImageFile,
  } = useBackgroundAligner({
    settings,
    wall,
    onSettingsChange,
  });

  useEffect(() => {
    if (settings.backgroundImage || settings.useBackgroundPhoto) {
      setShowBackgroundControls(true);
    }
  }, [settings.backgroundImage, settings.useBackgroundPhoto]);


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
            <p className='mt-1 text-xs text-blue-700'>
              Confidence: this standard is initially inferred from browser
              locale and can be overridden anytime.
            </p>
          </div>
          <div className='md:col-span-2 lg:col-span-5 rounded-lg border border-gray-200 bg-gray-50 p-3'>
            <label className='inline-flex items-start gap-3 text-sm text-gray-800 cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.noUtilityZonesConfirmed ?? false}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    noUtilityZonesConfirmed: e.target.checked,
                  })
                }
                className='mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <span>
                <strong>This wall is clear of power/plumbing zones</strong>
                <span className='block text-xs text-gray-600 mt-1'>
                  Use this only after you verify there are no outlets, switches,
                  or plumbing risks on this wall. Safety reminders will be hidden.
                </span>
              </span>
            </label>
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

        <PositioningControlsSection
          settings={settings}
          shelves={shelves}
          obstructions={obstructions}
          wall={wall}
          onSettingsChange={onSettingsChange}
        />

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
              <div className='md:col-span-3 text-xs text-blue-700'>
                Confidence: stud lines are estimates unless you provide custom
                measured stud locations.
              </div>
            </div>
          )}
        </div>
      </div>

      <WallDimensionsSection
        wall={wall}
        settings={settings}
        onWallChange={onWallChange}
      />

      <ItemsSection
        shelves={shelves}
        wall={wall}
        settings={settings}
        onAddItem={addShelf}
        onRemoveItem={removeShelf}
        onDuplicateItem={duplicateShelf}
        onUpdateItem={updateShelf}
        onSettingsChange={onSettingsChange}
      />

      <ObstructionsSection
        obstructions={obstructions}
        settings={settings}
        onAddObstruction={addObstruction}
        onRemoveObstruction={removeObstruction}
        onUpdateObstruction={updateObstruction}
        getObstructionDefaults={getObstructionDefaults}
      />
    </div>
  );
}

import { Plus, X, Home } from 'lucide-react';
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
  { value: 'other', label: 'Other' },
];

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

  const updateShelf = (
    id: string,
    updates: Partial<ShelfDimensions | WallItem>
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
      })
    );
  };

  const addObstruction = () => {
    const newObstruction: Obstruction = {
      id: `obstruction-${Date.now()}`,
      type: 'cabinet',
      width: 30,
      height: 60,
      distanceFromLeft: 0,
      distanceFromFloor: 0,
    };
    onObstructionsChange([...obstructions, newObstruction]);
  };

  const removeObstruction = (id: string) => {
    onObstructionsChange(
      obstructions.filter((obstruction) => obstruction.id !== id)
    );
  };

  const updateObstruction = (id: string, updates: Partial<Obstruction>) => {
    onObstructionsChange(
      obstructions.map((obstruction) =>
        obstruction.id === id ? { ...obstruction, ...updates } : obstruction
      )
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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Units
            </label>
            <select
              value={settings.unit}
              onChange={(e) =>
                onSettingsChange({ ...settings, unit: e.target.value as Unit })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
            >
              <option value='left'>Left Aligned</option>
              <option value='center'>Center Aligned</option>
              <option value='right'>Right Aligned</option>
            </select>
          </div>
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
                />
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Minimum Spacing ({settings.unit === 'inches' ? 'in' : 'cm'})
              </label>
              <input
                type='number'
                value={settings.minSpacing ?? 2}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    minSpacing: parseFloat(e.target.value) || 2,
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                min='0'
                step='0.5'
              />
            </div>
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
              Enable Stud Detection & Visualization
            </label>
          </div>

          {settings.enableStudDetection && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-blue-50 rounded-lg'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Standard Stud Spacing (
                  {settings.unit === 'inches' ? 'in' : 'cm'})
                </label>
                <select
                  value={settings.studSpacing || 16}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      studSpacing: parseFloat(e.target.value),
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='16'>16" on center (standard)</option>
                  <option value='24'>24" on center</option>
                </select>
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
              <div className='md:col-span-2 text-xs text-gray-600'>
                <strong>Tip:</strong> Use a stud finder to locate exact stud
                positions and enter them above, or use standard spacing as a
                guide.
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
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-semibold text-gray-900'>Items to Hang</h3>
          <button
            onClick={addShelf}
            className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='h-4 w-4' />
            Add Item
          </button>
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
                <button
                  onClick={() => removeShelf(item.id)}
                  className='text-red-600 hover:text-red-800 transition-colors'
                >
                  <X className='h-4 w-4' />
                </button>
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
                          : { weight: parseFloat(e.target.value) || undefined }
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
                value={settings.eyeLevelHeight || 57}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    eyeLevelHeight: parseFloat(e.target.value) || 57,
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Standard is 57"'
                min='40'
                max='72'
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
                    onChange={(e) =>
                      updateObstruction(obstruction.id, {
                        type: e.target.value as ObstructionType,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    {obstructionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
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
        </div>
      </div>
    </div>
  );
}

import { Plus, X } from 'lucide-react';
import {
  GalleryLayout,
  HangingMethod,
  ItemShape,
  ItemType,
  ProjectSettings,
  ShelfDimensions,
  WallDimensions,
  WallItem,
} from '../../types';
import { ItemTypeSelector } from '../ItemTypeSelector';
import { ItemPositioning } from '../ItemPositioning';
import { getObstructionStandardLabel } from '../../utils/obstructionStandards';

interface ItemsSectionProps {
  shelves: (ShelfDimensions | WallItem)[];
  wall: WallDimensions;
  settings: ProjectSettings;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<ShelfDimensions | WallItem>) => void;
  onSettingsChange: (settings: ProjectSettings) => void;
}

export function ItemsSection({
  shelves,
  wall,
  settings,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onUpdateItem,
  onSettingsChange,
}: ItemsSectionProps) {
  return (
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
          <strong>Safety check:</strong> Add outlets, switches, and plumbing zones as
          obstructions before drilling to reduce wire/pipe strike risk.
        </p>
        <p className='text-xs text-amber-800 mt-1'>
          New/updated obstruction types use{' '}
          {getObstructionStandardLabel(settings.obstructionStandard ?? 'us')} typical
          default sizes and placement heights.
        </p>
        <p className='text-xs text-blue-700 mt-1'>
          Confidence: presets are starting points and should be measured/edited
          to match your actual wall.
        </p>
      </div>
      <div className='space-y-4'>
        {shelves.map((item, index) => (
          <div key={item.id} className='border border-gray-200 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h4 className='font-medium text-gray-900'>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {index + 1}
              </h4>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => onDuplicateItem(item.id)}
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
                  onClick={() => onRemoveItem(item.id)}
                  className='text-red-600 hover:text-red-800 transition-colors p-2 rounded hover:bg-red-50'
                  title='Remove this item'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Item Type
              </label>
              <ItemTypeSelector
                selectedType={item.type}
                onTypeChange={(newType: ItemType) => {
                  if (newType === 'shelf') {
                    onUpdateItem(item.id, {
                      type: 'shelf',
                      depth: 8,
                      height: 1,
                    });
                  } else if (newType === 'tv') {
                    onUpdateItem(item.id, {
                      type: newType,
                      height: 24,
                      hangingMethod: 'bracket',
                    });
                  } else if (newType === 'mirror') {
                    onUpdateItem(item.id, {
                      type: newType,
                      height: 24,
                      hangingMethod: 'wire',
                      shape: 'rectangle',
                    });
                  } else {
                    onUpdateItem(item.id, {
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
                    if (
                      item.type === 'mirror' &&
                      ((item as WallItem).shape === 'circle' ||
                        (item as WallItem).shape === 'square')
                    ) {
                      onUpdateItem(item.id, {
                        width: newWidth,
                        height: newWidth,
                      });
                    } else {
                      onUpdateItem(item.id, {
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
                      onUpdateItem(item.id, {
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
                      if (
                        item.type === 'mirror' &&
                        ((item as WallItem).shape === 'circle' ||
                          (item as WallItem).shape === 'square')
                      ) {
                        onUpdateItem(item.id, {
                          width: newHeight,
                          height: newHeight,
                        });
                      } else {
                        onUpdateItem(item.id, {
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
                      <p className='text-xs text-gray-500 mt-1'>Locked to match width</p>
                    )}
                </div>
              )}

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  {item.type === 'shelf' ? 'Expected Weight (lbs)' : 'Weight (lbs)'}
                </label>
                <input
                  type='number'
                  value={
                    item.type === 'shelf'
                      ? (item as ShelfDimensions).expectedWeight || ''
                      : (item as WallItem).weight || ''
                  }
                  onChange={(e) =>
                    onUpdateItem(
                      item.id,
                      item.type === 'shelf'
                        ? {
                            expectedWeight: parseFloat(e.target.value) || undefined,
                          }
                        : { weight: parseFloat(e.target.value) || undefined },
                    )
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder={item.type === 'shelf' ? 'Expected weight' : 'Actual weight'}
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
                        onUpdateItem(item.id, {
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
                          if (newShape === 'circle' || newShape === 'square') {
                            const size = Math.max(item.width, item.height);
                            onUpdateItem(item.id, {
                              shape: newShape,
                              width: size,
                              height: size,
                            });
                          } else {
                            onUpdateItem(item.id, {
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
                          {(item as WallItem).shape === 'circle' ? 'circles' : 'squares'}
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
                          onUpdateItem(item.id, {
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

            <ItemPositioning
              item={item}
              index={index}
              wallWidth={wall.width}
              wallHeight={wall.height}
              unit={settings.unit}
              autoArrange={settings.autoArrange ?? true}
              snapToGrid={settings.snapToGrid ?? true}
              gridSize={settings.gridSize ?? 1}
              onUpdate={(id, updates) => onUpdateItem(id, updates)}
            />
          </div>
        ))}
        {shelves.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            No items added yet. Click "Add Item" to get started.
          </div>
        )}
      </div>

      <button
        onClick={onAddItem}
        className='mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
      >
        <Plus className='h-5 w-5' />
        Add Item
      </button>

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

          <div className='mt-3 p-3 bg-white rounded border border-purple-200'>
            <p className='text-xs font-semibold text-purple-900 mb-2'>
              {settings.galleryLayout === 'grid' && '📊 Grid Layout'}
              {settings.galleryLayout === 'salon' && '🎨 Salon Style'}
              {settings.galleryLayout === 'linear' && '➡️ Linear Layout'}
              {(!settings.galleryLayout || settings.galleryLayout === 'custom') &&
                '✏️ Custom Layout'}
            </p>
            <p className='text-xs text-gray-700'>
              {settings.galleryLayout === 'grid' &&
                'Items arranged in evenly-spaced rows and columns, centered around eye level. Perfect for uniform collections or photo galleries.'}
              {settings.galleryLayout === 'salon' &&
                'Largest piece at eye level center, others clustered organically around it. Classic museum/gallery style for varied sizes.'}
              {settings.galleryLayout === 'linear' &&
                'All items in a single horizontal row at eye level. Great for hallways or above furniture.'}
              {(!settings.galleryLayout || settings.galleryLayout === 'custom') &&
                'Manually position each item using the Position Controls below. Use eye level as a reference guide.'}
            </p>
          </div>

          <div className='mt-3'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Eye Level Height ({settings.unit === 'inches' ? 'in' : 'cm'}) - Center of
              artwork
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
              placeholder={settings.unit === 'cm' ? 'Standard is 145 cm' : 'Standard is 57"'}
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
  );
}

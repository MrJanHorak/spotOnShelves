import {
  Obstruction,
  ProjectSettings,
  ShelfDimensions,
  WallDimensions,
  WallItem,
} from '../../types';

interface PositioningControlsSectionProps {
  settings: ProjectSettings;
  shelves: (ShelfDimensions | WallItem)[];
  obstructions: Obstruction[];
  wall: WallDimensions;
  onSettingsChange: (settings: ProjectSettings) => void;
}

export function PositioningControlsSection({
  settings,
  shelves,
  obstructions,
  wall,
  onSettingsChange,
}: PositioningControlsSectionProps) {
  const hasWallItems = shelves.some((item) => item.type !== 'shelf');
  const isGridLayout = settings.galleryLayout === 'grid' && hasWallItems;

  return (
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
            {isGridLayout && (
              <button
                onClick={() => {
                  const wallItems = shelves.filter((item) => item.type !== 'shelf');
                  if (wallItems.length === 0) return;

                  const cols = Math.ceil(Math.sqrt(wallItems.length));
                  const rows = Math.ceil(wallItems.length / cols);
                  const maxWidth = Math.max(...wallItems.map((item) => item.width));
                  const maxHeight = Math.max(...wallItems.map((item) => item.height));

                  const sortedObs = [...obstructions].sort(
                    (a, b) => a.distanceFromLeft - b.distanceFromLeft,
                  );

                  const horizontalZones: Array<{ start: number; end: number }> = [];
                  const margin = 4;

                  let currentX = margin;
                  for (const obs of sortedObs) {
                    if (currentX < obs.distanceFromLeft - margin) {
                      horizontalZones.push({
                        start: currentX,
                        end: obs.distanceFromLeft - margin,
                      });
                    }
                    currentX = Math.max(
                      currentX,
                      obs.distanceFromLeft + obs.width + margin,
                    );
                  }

                  if (currentX < wall.width - margin) {
                    horizontalZones.push({
                      start: currentX,
                      end: wall.width - margin,
                    });
                  }

                  if (horizontalZones.length === 0) {
                    horizontalZones.push({
                      start: margin,
                      end: wall.width - margin,
                    });
                  }

                  let bestZone = horizontalZones[0];
                  for (const zone of horizontalZones) {
                    if (zone.end - zone.start > bestZone.end - bestZone.start) {
                      bestZone = zone;
                    }
                  }

                  const availableWidth = bestZone.end - bestZone.start;
                  const availableHeight = wall.height - 2 * margin;
                  const totalItemWidth = cols * maxWidth;
                  const totalItemHeight = rows * maxHeight;

                  const horizontalSpacing =
                    cols > 1 ? (availableWidth - totalItemWidth) / (cols - 1) : 0;
                  const verticalSpacing =
                    rows > 1 ? (availableHeight - totalItemHeight) / (rows - 1) : 0;

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
          {isGridLayout && (
            <p className='text-xs text-blue-700 mt-2 p-2 bg-blue-50 rounded border border-blue-200'>
              <strong>💡 Smart Layout:</strong> Click "Auto" to calculate ideal
              spacing that avoids obstructions (like doors) and fits items evenly
              in the available space between them.
            </p>
          )}
        </div>

        {isGridLayout && (
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
                    const { horizontalSpacing, verticalSpacing, ...rest } = settings;
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
                    Horizontal Gap ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type='number'
                    value={settings.horizontalSpacing ?? 6}
                    onChange={(e) =>
                      onSettingsChange({
                        ...settings,
                        horizontalSpacing: parseFloat(e.target.value) || 6,
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
                    Vertical Gap ({settings.unit === 'inches' ? 'in' : 'cm'})
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
              Enable to independently adjust horizontal and vertical spacing
              between items
            </p>
          </div>
        )}

        {isGridLayout && (
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
                <label htmlFor='dist-centered' className='ml-2 text-sm text-gray-700'>
                  <span className='font-medium'>📍 Centered</span>
                  <span className='text-xs text-gray-600 block'>
                    Grid centered on wall (larger margins on left/right edges)
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
                <label htmlFor='dist-even' className='ml-2 text-sm text-gray-700'>
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
  );
}

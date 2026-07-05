import { ProjectSettings, WallDimensions } from '../../types';

interface WallDimensionsSectionProps {
  wall: WallDimensions;
  settings: ProjectSettings;
  onWallChange: (wall: WallDimensions) => void;
}

export function WallDimensionsSection({
  wall,
  settings,
  onWallChange,
}: WallDimensionsSectionProps) {
  return (
    <div>
      <h3 className='text-xl font-semibold text-gray-900 mb-4'>Wall Dimensions</h3>
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
  );
}

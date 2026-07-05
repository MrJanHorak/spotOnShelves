import { Plus, X } from 'lucide-react';
import {
  Obstruction,
  ObstructionType,
  ProjectSettings,
  ObstructionStandard,
} from '../../types';
import { getObstructionStandardLabel } from '../../utils/obstructionStandards';

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

interface ObstructionsSectionProps {
  obstructions: Obstruction[];
  settings: ProjectSettings;
  onAddObstruction: () => void;
  onRemoveObstruction: (id: string) => void;
  onUpdateObstruction: (id: string, updates: Partial<Obstruction>) => void;
  getObstructionDefaults: (type: ObstructionType) => Partial<Obstruction>;
}

export function ObstructionsSection({
  obstructions,
  settings,
  onAddObstruction,
  onRemoveObstruction,
  onUpdateObstruction,
  getObstructionDefaults,
}: ObstructionsSectionProps) {
  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-xl font-semibold text-gray-900'>Wall Obstructions</h3>
        <button
          onClick={onAddObstruction}
          className='flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors'
        >
          <Plus className='h-4 w-4' />
          Add Obstruction
        </button>
      </div>
      <div className='space-y-4'>
        {obstructions.map((obstruction, index) => (
          <div key={obstruction.id} className='border border-gray-200 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h4 className='font-medium text-gray-900'>
                {obstruction.type.charAt(0).toUpperCase() + obstruction.type.slice(1)}{' '}
                {index + 1}
              </h4>
              <button
                onClick={() => onRemoveObstruction(obstruction.id)}
                className='text-red-600 hover:text-red-800 transition-colors'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='lg:col-span-3'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Type</label>
                <select
                  value={obstruction.type}
                  onChange={(e) => {
                    const nextType = e.target.value as ObstructionType;
                    onUpdateObstruction(
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
                    onUpdateObstruction(
                      obstruction.id,
                      getObstructionDefaults(obstruction.type),
                    )
                  }
                  className='mt-2 text-xs text-blue-700 hover:text-blue-900 underline'
                >
                  Apply{' '}
                  {getObstructionStandardLabel(
                    (settings.obstructionStandard ?? 'us') as ObstructionStandard,
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
                    onUpdateObstruction(obstruction.id, {
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
                    onUpdateObstruction(obstruction.id, {
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
                  Distance from Left ({settings.unit === 'inches' ? 'in' : 'cm'})
                </label>
                <input
                  type='number'
                  value={obstruction.distanceFromLeft}
                  onChange={(e) =>
                    onUpdateObstruction(obstruction.id, {
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
                  Distance from Floor ({settings.unit === 'inches' ? 'in' : 'cm'})
                </label>
                <input
                  type='number'
                  value={obstruction.distanceFromFloor}
                  onChange={(e) =>
                    onUpdateObstruction(obstruction.id, {
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
          !obstructions.some((o) => ['outlet', 'switch', 'plumbing'].includes(o.type)) && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
              You have no electrical/plumbing obstructions marked yet. Confirm outlet,
              switch, and pipe zones before drilling.
            </div>
          )}
      </div>
    </div>
  );
}

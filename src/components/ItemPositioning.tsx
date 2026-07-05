import {
  Lock,
  Unlock,
  Grid3x3,
  AlignHorizontalSpaceAround,
} from 'lucide-react';
import { ShelfDimensions, WallItem, Unit } from '../types';

interface ItemPositioningProps {
  item: ShelfDimensions | WallItem;
  index: number;
  unit: Unit;
  wallWidth: number;
  wallHeight: number;
  onUpdate: (id: string, updates: Partial<ShelfDimensions | WallItem>) => void;
  autoArrange: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export function ItemPositioning({
  item,
  unit,
  wallWidth,
  wallHeight,
  onUpdate,
  autoArrange,
  snapToGrid,
  gridSize,
}: ItemPositioningProps) {
  const isLocked = item.locked || false;
  const hasManualPosition = !!item.manualPosition;

  const handlePositionChange = (
    field: 'distanceFromLeft' | 'distanceFromFloor',
    value: number
  ) => {
    let finalValue = value;

    // Snap to grid if enabled
    if (snapToGrid) {
      finalValue = Math.round(value / gridSize) * gridSize;
    }

    // Ensure within bounds
    if (field === 'distanceFromLeft') {
      finalValue = Math.max(0, Math.min(finalValue, wallWidth - item.width));
    } else {
      const itemHeight = item.height || 1;
      finalValue = Math.max(0, Math.min(finalValue, wallHeight - itemHeight));
    }

    // If this is the first manual position change, initialize both fields
    const currentPosition = item.manualPosition || {
      distanceFromLeft: (wallWidth - item.width) / 2,
      distanceFromFloor: (wallHeight - (item.height || 1)) / 2,
    };

    onUpdate(item.id, {
      manualPosition: {
        ...currentPosition,
        [field]: finalValue,
      } as { distanceFromLeft: number; distanceFromFloor: number },
      // Auto-lock when user manually positions (if auto-arrange is on)
      ...(autoArrange && !isLocked ? { locked: true } : {}),
    });
  };

  const toggleLock = () => {
    if (!isLocked && !hasManualPosition) {
      // When locking for the first time without a manual position,
      // initialize it at the center of the wall
      const itemHeight = item.height || 1;
      const centerX = (wallWidth - item.width) / 2;
      const centerY = (wallHeight - itemHeight) / 2;

      onUpdate(item.id, {
        locked: true,
        manualPosition: {
          distanceFromLeft: centerX,
          distanceFromFloor: centerY,
        },
      });
    } else {
      onUpdate(item.id, { locked: !isLocked });
    }
  };

  const resetToAuto = () => {
    onUpdate(item.id, { manualPosition: undefined, locked: false });
  };

  const itemTypeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

  // Allow manual positioning if: auto-arrange is off OR item is locked OR has manual position
  const canManuallyPosition = !autoArrange || isLocked || hasManualPosition;

  return (
    <div className='mt-4 pt-4 border-t border-gray-200'>
      <div className='flex items-center justify-between mb-3'>
        <h5 className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
          <Grid3x3 className='h-4 w-4 text-blue-600' />
          Position Controls
        </h5>
        <div className='flex items-center gap-2'>
          {hasManualPosition && (
            <button
              onClick={resetToAuto}
              className='text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
              title='Reset to automatic positioning'
            >
              Reset to Auto
            </button>
          )}
          {autoArrange && (
            <button
              onClick={toggleLock}
              className={`p-1.5 rounded transition-colors ${
                isLocked
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={
                isLocked
                  ? 'Unlock to allow auto-arrangement'
                  : 'Lock to prevent auto-arrangement'
              }
            >
              {isLocked ? (
                <Lock className='h-4 w-4' />
              ) : (
                <Unlock className='h-4 w-4' />
              )}
            </button>
          )}
        </div>
      </div>

      {autoArrange && !canManuallyPosition && (
        <div className='mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800'>
          <AlignHorizontalSpaceAround className='h-3 w-3 inline mr-1' />
          Auto-arrange is enabled. Click{' '}
          <button
            onClick={toggleLock}
            className='font-semibold underline hover:text-blue-900'
          >
            lock
          </button>{' '}
          to manually position this item.
        </div>
      )}

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>
            Distance from Left ({unit === 'inches' ? 'in' : 'cm'})
          </label>
          <input
            type='number'
            value={
              item.manualPosition?.distanceFromLeft !== undefined
                ? item.manualPosition.distanceFromLeft.toFixed(1)
                : ''
            }
            onChange={(e) =>
              handlePositionChange(
                'distanceFromLeft',
                parseFloat(e.target.value) || 0
              )
            }
            className='w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder='Auto'
            min='0'
            max={wallWidth - item.width}
            step={snapToGrid ? gridSize : 0.1}
          />
        </div>
        <div>
          <label className='block text-xs font-medium text-gray-700 mb-1'>
            Distance from Floor ({unit === 'inches' ? 'in' : 'cm'})
          </label>
          <input
            type='number'
            value={
              item.manualPosition?.distanceFromFloor !== undefined
                ? item.manualPosition.distanceFromFloor.toFixed(1)
                : ''
            }
            onChange={(e) =>
              handlePositionChange(
                'distanceFromFloor',
                parseFloat(e.target.value) || 0
              )
            }
            className='w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder='Auto'
            min='0'
            max={wallHeight - (item.height || 1)}
            step={snapToGrid ? gridSize : 0.1}
          />
        </div>
      </div>

      {hasManualPosition && !isLocked && autoArrange && (
        <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded'>
          <p className='text-xs text-yellow-800'>
            ⚠️ This {itemTypeLabel.toLowerCase()} has a custom position but
            isn't locked - it may be repositioned by auto-arrange
          </p>
        </div>
      )}

      {isLocked && (
        <div className='mt-2 p-2 bg-amber-50 border border-amber-200 rounded'>
          <p className='text-xs text-amber-800'>
            🔒 Position locked - this {itemTypeLabel.toLowerCase()} won't be
            automatically repositioned
          </p>
        </div>
      )}

      {snapToGrid && (
        <div className='mt-2 text-xs text-gray-600'>
          <Grid3x3 className='h-3 w-3 inline mr-1' />
          Snap to grid: {gridSize}" increments
        </div>
      )}
    </div>
  );
}

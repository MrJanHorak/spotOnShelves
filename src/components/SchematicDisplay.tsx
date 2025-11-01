import {
  WallDimensions,
  Obstruction,
  ShelfPlacement,
  Unit,
  WallMaterial,
  MountingType,
} from '../types';
import { formatMeasurement, calculateMaterials } from '../utils/calculations';

interface SchematicDisplayProps {
  wall: WallDimensions;
  obstructions: Obstruction[];
  shelves: ShelfPlacement[];
  unit: Unit;
  wallMaterial?: string;
  mountingType?: string;
  useStuds?: boolean;
  selectedShelfId?: string | null;
  onHoverShelf?: (id: string | null) => void;
}

export function SchematicDisplay({
  wall,
  obstructions,
  shelves,
  unit,
  wallMaterial = 'drywall',
  mountingType = 'floating',
  useStuds = false,
  selectedShelfId = null,
  onHoverShelf,
}: SchematicDisplayProps) {
  // local mount state to trigger staggered animations
  let mounted = false;
  // small helper to add a 'mounted' class after a tick
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      if (!mounted) {
        mounted = true;
        document.querySelectorAll('.bracket-marker').forEach((el, i) => {
          (el as HTMLElement).style.transitionDelay = `${i * 60}ms`;
          (el as HTMLElement).classList.add('marker-mounted');
        });
      }
    }, 120);
  }
  // Calculate scale to fit within container
  const containerWidth = 600;
  const containerHeight = 400;
  const scale =
    Math.min(
      containerWidth / Math.max(wall.width, 1),
      containerHeight / Math.max(wall.height, 1)
    ) * 0.9; // 90% to leave some margin

  const scaledWidth = wall.width * scale;
  const scaledHeight = wall.height * scale;
  const offsetX = (containerWidth - scaledWidth) / 2;
  const offsetY = (containerHeight - scaledHeight) / 2;

  const getObstructionColor = (type: string) => {
    const colors = {
      bed: '#EF4444', // red
      cabinet: '#F97316', // orange
      door: '#10B981', // green
      window: '#3B82F6', // blue
      tv: '#8B5CF6', // purple
      other: '#6B7280', // gray
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <div className='bg-white rounded-xl shadow-lg p-6'>
      <h2 className='text-2xl font-bold text-gray-900 mb-6'>Wall Schematic</h2>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* SVG Schematic */}
        <div className='flex-1'>
          <div
            id='schematic-container'
            className='border border-gray-300 rounded-lg bg-gray-50 mx-auto'
            style={{ width: containerWidth, height: containerHeight }}
          >
            <svg
              id='schematic-svg'
              width={containerWidth}
              height={containerHeight}
              className='overflow-visible'
            >
              <style>{`
                .bracket-marker { opacity: 0; transform: translateY(6px); }
                .bracket-marker.marker-mounted { opacity: 1; transform: translateY(0); transition: opacity 320ms ease, transform 320ms cubic-bezier(.2,.9,.28,1); }
                .bracket-marker:hover line, .bracket-marker:hover circle { transform: scale(1.05); }
              `}</style>
              {/* Wall Background */}
              <rect
                x={offsetX}
                y={offsetY}
                width={scaledWidth}
                height={scaledHeight}
                fill='#F9FAFB'
                stroke='#374151'
                strokeWidth='2'
                rx='4'
              />

              {/* Wall Dimensions */}
              <text
                x={offsetX + scaledWidth / 2}
                y={offsetY - 10}
                textAnchor='middle'
                className='text-sm font-medium'
                fill='#374151'
              >
                {formatMeasurement(wall.width, unit)}
              </text>
              <text
                x={offsetX - 10}
                y={offsetY + scaledHeight / 2}
                textAnchor='middle'
                className='text-sm font-medium'
                fill='#374151'
                transform={`rotate(-90 ${offsetX - 10} ${
                  offsetY + scaledHeight / 2
                })`}
              >
                {formatMeasurement(wall.height, unit)}
              </text>

              {/* Obstructions */}
              {obstructions.map((obstruction) => (
                <g key={obstruction.id}>
                  <rect
                    x={offsetX + obstruction.distanceFromLeft * scale}
                    y={
                      offsetY +
                      (wall.height -
                        obstruction.distanceFromFloor -
                        obstruction.height) *
                        scale
                    }
                    width={obstruction.width * scale}
                    height={obstruction.height * scale}
                    fill={getObstructionColor(obstruction.type)}
                    fillOpacity='0.3'
                    stroke={getObstructionColor(obstruction.type)}
                    strokeWidth='2'
                    rx='2'
                  />
                  <text
                    x={
                      offsetX +
                      (obstruction.distanceFromLeft + obstruction.width / 2) *
                        scale
                    }
                    y={
                      offsetY +
                      (wall.height -
                        obstruction.distanceFromFloor -
                        obstruction.height / 2) *
                        scale
                    }
                    textAnchor='middle'
                    className='text-xs font-medium'
                    fill={getObstructionColor(obstruction.type)}
                    dominantBaseline='middle'
                  >
                    {obstruction.type.toUpperCase()}
                  </text>
                </g>
              ))}

              {/* Shelves */}
              {shelves.map((shelf, index) => (
                <g key={shelf.id}>
                  <rect
                    x={offsetX + shelf.distanceFromLeft * scale}
                    y={
                      offsetY +
                      (wall.height - shelf.distanceFromFloor - 1) * scale
                    } // 1 unit shelf height
                    width={shelf.width * scale}
                    height={1 * scale}
                    fill='#059669'
                    stroke='#047857'
                    strokeWidth='2'
                    rx='1'
                  />
                  <text
                    x={
                      offsetX +
                      (shelf.distanceFromLeft + shelf.width / 2) * scale
                    }
                    y={
                      offsetY +
                      (wall.height - shelf.distanceFromFloor - 0.5) * scale
                    }
                    textAnchor='middle'
                    className='text-xs font-bold'
                    fill='white'
                    dominantBaseline='middle'
                  >
                    SHELF {index + 1}
                  </text>

                  {/* Shelf measurement lines */}
                  <line
                    x1={offsetX}
                    y1={
                      offsetY + (wall.height - shelf.distanceFromFloor) * scale
                    }
                    x2={offsetX + shelf.distanceFromLeft * scale}
                    y2={
                      offsetY + (wall.height - shelf.distanceFromFloor) * scale
                    }
                    stroke='#6B7280'
                    strokeWidth='1'
                    strokeDasharray='2,2'
                  />
                  <line
                    x1={offsetX + shelf.distanceFromLeft * scale}
                    y1={offsetY + scaledHeight}
                    x2={offsetX + shelf.distanceFromLeft * scale}
                    y2={
                      offsetY + (wall.height - shelf.distanceFromFloor) * scale
                    }
                    stroke='#6B7280'
                    strokeWidth='1'
                    strokeDasharray='2,2'
                  />

                  {/* Bracket markers */}
                  {(() => {
                    // Derive brackets for this shelf using current settings
                    const perShelf =
                      calculateMaterials(
                        [shelf],
                        (wallMaterial as WallMaterial) || 'drywall',
                        (mountingType as MountingType) || 'floating',
                        { useStuds }
                      ).perShelf || [];
                    const bracketsForThisShelf = perShelf[0]?.brackets || 2;

                    const positions: number[] = [];
                    for (let i = 0; i < bracketsForThisShelf; i++) {
                      // distribute across shelf width (centered positions)
                      const px =
                        shelf.distanceFromLeft +
                        (shelf.width * (i + 0.5)) / bracketsForThisShelf;
                      positions.push(px);
                    }

                    return positions.map((px, bi) => {
                      const isSelected = selectedShelfId === shelf.id;
                      return (
                        <g
                          key={`br-${shelf.id}-${bi}`}
                          className={`bracket-marker group br-${shelf.id}`}
                          data-shelf-id={shelf.id}
                          onMouseEnter={() =>
                            onHoverShelf && onHoverShelf(shelf.id)
                          }
                          onMouseLeave={() =>
                            onHoverShelf && onHoverShelf(null)
                          }
                        >
                          <line
                            x1={offsetX + px * scale}
                            y1={
                              offsetY +
                              (wall.height - shelf.distanceFromFloor - 1) *
                                scale
                            }
                            x2={offsetX + px * scale}
                            y2={
                              offsetY +
                              (wall.height - shelf.distanceFromFloor) * scale
                            }
                            stroke={isSelected ? '#b45309' : '#111827'}
                            strokeWidth={isSelected ? 3 : 2}
                            style={{
                              transition:
                                'stroke 220ms ease, stroke-width 220ms ease',
                              transformOrigin: 'center',
                            }}
                          />
                          <circle
                            cx={offsetX + px * scale}
                            cy={
                              offsetY +
                              (wall.height - shelf.distanceFromFloor - 0.5) *
                                scale
                            }
                            r={isSelected ? 4 : 2}
                            fill={isSelected ? '#b45309' : '#111827'}
                            style={{
                              transition: 'r 220ms ease, fill 220ms ease',
                              transformOrigin: 'center',
                            }}
                          />
                        </g>
                      );
                    });
                  })()}
                </g>
              ))}

              {/* Grid lines for reference */}
              <defs>
                <pattern
                  id='grid'
                  width='20'
                  height='20'
                  patternUnits='userSpaceOnUse'
                >
                  <path
                    d='M 20 0 L 0 0 0 20'
                    fill='none'
                    stroke='#E5E7EB'
                    strokeWidth='0.5'
                  />
                </pattern>
              </defs>
              <rect
                x={offsetX}
                y={offsetY}
                width={scaledWidth}
                height={scaledHeight}
                fill='url(#grid)'
                opacity='0.3'
              />
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className='w-full lg:w-64 space-y-4'>
          <div>
            <h3 className='font-semibold text-gray-900 mb-2'>Legend</h3>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 bg-gray-100 border-2 border-gray-600 rounded'></div>
                <span>Wall</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 bg-green-600 rounded'></div>
                <span>Shelves</span>
              </div>
            </div>
          </div>

          {obstructions.length > 0 && (
            <div>
              <h4 className='font-medium text-gray-900 mb-2'>Obstructions</h4>
              <div className='space-y-1 text-sm'>
                {Array.from(new Set(obstructions.map((o) => o.type))).map(
                  (type) => (
                    <div key={type} className='flex items-center gap-2'>
                      <div
                        className='w-4 h-4 rounded opacity-60'
                        style={{ backgroundColor: getObstructionColor(type) }}
                      ></div>
                      <span className='capitalize'>{type}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className='text-xs text-gray-500 bg-gray-50 p-2 rounded'>
            <strong>Scale:</strong> This diagram is proportionally scaled to
            show relative positions. Use the measurements panel for exact
            dimensions.
          </div>
        </div>
      </div>
    </div>
  );
}

// react hooks imported below
import {
  WallDimensions,
  Obstruction,
  ShelfPlacement,
  Unit,
  WallMaterial,
  MountingType,
} from '../types';
import {
  formatMeasurement,
  calculateMaterials,
  calculateStudLocations,
} from '../utils/calculations';
import { useEffect, useRef, useState } from 'react';

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
  studSpacing?: number;
  firstStudOffset?: number;
  customStudLocations?: number[];
  enableStudDetection?: boolean;
  isCompact?: boolean;
  backgroundImage?: string | null;
  backgroundOpacity?: number;
  useBackgroundPhoto?: boolean;
  wallAlignmentX?: number;
  wallAlignmentY?: number;
  wallScaleFactor?: number;
  onWallAlignmentChange?: (x: number, y: number, scale: number) => void;
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
  studSpacing = 16,
  firstStudOffset = 16,
  customStudLocations,
  enableStudDetection = false,
  isCompact = false,
  backgroundImage = null,
  backgroundOpacity = 0.6,
  useBackgroundPhoto = false,
  wallAlignmentX = 0,
  wallAlignmentY = 0,
  wallScaleFactor = 1,
  onWallAlignmentChange,
}: SchematicDisplayProps) {
  // Wall dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const schematicPaneRef = useRef<HTMLDivElement>(null);
  // Alignment handles state (created after layout calculations)
  // (alignment handles removed — feature disabled per user request)

  // toLocalX removed (alignment handles disabled)

  // Note: pointer handling is implemented using Pointer Events below. We
  // attach a single pointermove/pointerup listener to the window and use
  // pointer capture on the handle element to keep events scoped to the drag.
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgNaturalRef = useRef<{ width: number; height: number } | null>(null);

  // Preload image to get natural size for fit-to-wall calculations
  useEffect(() => {
    if (!backgroundImage) return;
    const img = new Image();
    img.onload = () => {
      imgNaturalRef.current = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
      // If we have a ref'd img element, update its src to ensure natural sizes
      if (imgRef.current) imgRef.current.src = backgroundImage;
    };
    img.src = backgroundImage;
  }, [backgroundImage]);
  // Display options state
  const [showStuds, setShowStuds] = useState(true);
  const [showBracketDetails, setShowBracketDetails] = useState(false);
  const [showSpacing, setShowSpacing] = useState(true);
  const [availableWidth, setAvailableWidth] = useState(700);

  useEffect(() => {
    const updateAvailableWidth = () => {
      const paneWidth = schematicPaneRef.current?.clientWidth;
      if (!paneWidth) return;
      setAvailableWidth(Math.max(240, paneWidth));
    };

    updateAvailableWidth();

    const pane = schematicPaneRef.current;
    let observer: ResizeObserver | null = null;
    if (pane && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateAvailableWidth();
      });
      observer.observe(pane);
    }

    window.addEventListener('resize', updateAvailableWidth);
    return () => {
      window.removeEventListener('resize', updateAvailableWidth);
      if (observer) observer.disconnect();
    };
  }, [isCompact]);

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
  // Calculate container and wall dimensions
  const showSidebar = !isCompact;
  const baseWidth = Math.min(700, availableWidth);
  const baseHeight = Math.round((350 / 700) * baseWidth);
  const compactScale = 0.42;
  const showDetailedOverlays = !isCompact;
  const containerWidth = Math.round(
    isCompact ? baseWidth * compactScale : baseWidth,
  );
  const containerHeight = Math.round(
    isCompact ? baseHeight * compactScale : baseHeight,
  );

  // Calculate wall scale: when using background photo, respect wallScaleFactor
  // Otherwise, auto-fit the wall to the container
  const autoFitScale =
    (Math.min(
      containerWidth / Math.max(wall.width, 1),
      containerHeight / Math.max(wall.height, 1),
    ) *
      0.9) /
    (isCompact ? compactScale : 1);

  const wallScale = useBackgroundPhoto ? wallScaleFactor : autoFitScale;

  // Wall dimensions in pixels (at base scale, before compact scaling)
  const scaledWidth = wall.width * wallScale;
  const scaledHeight = wall.height * wallScale;

  // Default centered position (in base container coordinates)
  const defaultX = (baseWidth - scaledWidth) / 2;
  const defaultY = (baseHeight - scaledHeight) / 2;

  const unclampedWallX = useBackgroundPhoto
    ? (wallAlignmentX ?? defaultX)
    : defaultX;
  const unclampedWallY = useBackgroundPhoto
    ? (wallAlignmentY ?? defaultY)
    : defaultY;
  const maxWallX = Math.max(0, baseWidth - scaledWidth);
  const maxWallY = Math.max(0, baseHeight - scaledHeight);

  // Clamp wall position so narrow/mobile layouts never render off-canvas
  const wallX = Math.min(Math.max(unclampedWallX, 0), maxWallX);
  const wallY = Math.min(Math.max(unclampedWallY, 0), maxWallY);

  // Apply compact scaling to positions for rendering
  const offsetX = wallX * (isCompact ? compactScale : 1);
  const offsetY = wallY * (isCompact ? compactScale : 1);

  // The scale for rendering items includes compact scaling
  const scale = wallScale * (isCompact ? compactScale : 1);

  // Handle drag to reposition wall
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!useBackgroundPhoto || !onWallAlignmentChange || !containerRef.current)
      return;
    setIsDragging(true);
    // Convert pointer position to container-relative coordinates
    const rect = containerRef.current.getBoundingClientRect();
    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;

    // Convert to base coordinates (undo compact scaling)
    const baseX = containerX / (isCompact ? compactScale : 1);
    const baseY = containerY / (isCompact ? compactScale : 1);

    // Store the offset between pointer and wall position
    setDragStart({ x: baseX - wallX, y: baseY - wallY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !onWallAlignmentChange || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;

    // Convert to base coordinates
    const baseX = containerX / (isCompact ? compactScale : 1);
    const baseY = containerY / (isCompact ? compactScale : 1);

    const newX = baseX - dragStart.x;
    const newY = baseY - dragStart.y;

    // Save positions in base coordinates (not scaled)
    onWallAlignmentChange(newX, newY, wallScaleFactor);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Handle wheel to scale wall
  const handleWheel = (e: React.WheelEvent) => {
    if (!useBackgroundPhoto || !onWallAlignmentChange) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.1, Math.min(5, wallScaleFactor * delta));
    // Keep position in base coordinates
    onWallAlignmentChange(
      wallAlignmentX ?? defaultX,
      wallAlignmentY ?? defaultY,
      newScale,
    );
  };

  const getObstructionColor = (type: string) => {
    const colors = {
      bed: '#EF4444', // red
      cabinet: '#F97316', // orange
      door: '#10B981', // green
      window: '#3B82F6', // blue
      tv: '#8B5CF6', // purple
      outlet: '#06B6D4', // cyan
      switch: '#14B8A6', // teal
      plumbing: '#0EA5E9', // sky
      other: '#6B7280', // gray
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  // Calculate stud locations
  const studLocations = enableStudDetection
    ? customStudLocations && customStudLocations.length > 0
      ? customStudLocations
      : calculateStudLocations(wall.width, studSpacing, firstStudOffset)
    : [];

  // --- Alignment handles: create and pointer handlers after layout computed ---
  // Initialize handles around the wall width if not set
  // alignment handle logic removed

  // alignment handle logic removed

  return (
    <div
      className={`bg-white rounded-xl shadow-lg transition-all duration-300 ${
        isCompact ? 'p-4' : 'p-6'
      }`}
      style={{
        transformOrigin: 'top center',
        boxShadow: isCompact
          ? '0 12px 24px -12px rgba(15, 23, 42, 0.35)'
          : undefined,
      }}
    >
      {showSidebar && (
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>
          Wall Schematic
        </h2>
      )}

      <div
        className={`flex flex-col ${
          showSidebar ? 'lg:flex-row gap-6' : 'items-center'
        }`}
      >
        {/* SVG Schematic */}
        <div ref={schematicPaneRef} className='flex-1'>
          <div
            ref={containerRef}
            id='schematic-container'
            className='border border-gray-300 rounded-lg bg-gray-50 mx-auto relative'
            style={{
              width: containerWidth,
              height: containerHeight,
              transition: 'width 240ms ease, height 240ms ease',
              overflow: 'hidden',
            }}
            onWheel={handleWheel}
          >
            {/* Background photo - full size, positioned absolutely */}
            {useBackgroundPhoto && backgroundImage && (
              <img
                ref={imgRef}
                src={backgroundImage}
                alt='Wall background'
                crossOrigin='anonymous'
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  opacity: backgroundOpacity,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* alignment handles removed per user request */}

            <svg
              id='schematic-svg'
              width={containerWidth}
              height={containerHeight}
              className='overflow-visible relative z-10'
              role='img'
              aria-label='Wall schematic showing item placements, spacing, and obstructions'
            >
              <style>{`
                .bracket-marker { opacity: 0; transform: translateY(6px); }
                .bracket-marker.marker-mounted { opacity: 1; transform: translateY(0); transition: opacity 320ms ease, transform 320ms cubic-bezier(.2,.9,.28,1); }
                .bracket-marker:hover line, .bracket-marker:hover circle { transform: scale(1.05); }
              `}</style>
              {/* Draggable wall group - only interactive when background photo is active */}
              <g
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  cursor: useBackgroundPhoto
                    ? isDragging
                      ? 'grabbing'
                      : 'grab'
                    : 'default',
                }}
              >
                {/* Wall Background */}
                <rect
                  x={offsetX}
                  y={offsetY}
                  width={scaledWidth * (isCompact ? compactScale : 1)}
                  height={scaledHeight * (isCompact ? compactScale : 1)}
                  fill='none'
                  stroke='#374151'
                  strokeWidth='2'
                  strokeDasharray={useBackgroundPhoto ? '8,4' : 'none'}
                  rx='4'
                />

                {/* Grid overlay inside the wall — placed behind items so the
                  image shows through and items render on top */}
                <rect
                  x={offsetX}
                  y={offsetY}
                  width={scaledWidth * (isCompact ? compactScale : 1)}
                  height={scaledHeight * (isCompact ? compactScale : 1)}
                  fill='url(#grid)'
                  opacity='0.12'
                  pointerEvents='none'
                />

                {/* Stud Indicators */}
                {showStuds &&
                  showDetailedOverlays &&
                  studLocations.map((studPos, index) => {
                    const x = offsetX + studPos * scale;
                    return (
                      <g key={`stud-${index}`}>
                        <line
                          x1={x}
                          y1={offsetY}
                          x2={x}
                          y2={offsetY + scaledHeight}
                          stroke='#D1D5DB'
                          strokeWidth='1.5'
                          strokeDasharray='6,4'
                          opacity='0.5'
                        />
                        <circle
                          cx={x}
                          cy={offsetY - 12}
                          r='6'
                          fill='#F3F4F6'
                          stroke='#9CA3AF'
                          strokeWidth='1'
                        />
                        <text
                          x={x}
                          y={offsetY - 12}
                          textAnchor='middle'
                          dominantBaseline='middle'
                          className='text-xs font-medium'
                          fill='#6B7280'
                          fontSize='8'
                        >
                          S
                        </text>
                      </g>
                    );
                  })}

                {/* Wall Dimensions */}
                {showDetailedOverlays && (
                  <>
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
                  </>
                )}

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
                    {showDetailedOverlays && (
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
                    )}
                  </g>
                ))}

                {/* Items (Shelves and Wall Items) */}
                {shelves.map((item, index) => {
                  // Calculate capacity for shelves to show on schematic
                  const itemMaterials =
                    item.type === 'shelf'
                      ? calculateMaterials(
                          [item],
                          (wallMaterial as WallMaterial) || 'drywall',
                          (mountingType as MountingType) || 'floating',
                          { useStuds },
                        )
                      : null;
                  const itemCapacity =
                    itemMaterials?.perShelf?.[0]?.maxWeightCapacity;

                  // Determine item color and style based on type
                  const getItemColor = () => {
                    switch (item.type) {
                      case 'shelf':
                        return { fill: '#059669', stroke: '#047857' };
                      case 'picture':
                        return { fill: '#8B5CF6', stroke: '#7C3AED' };
                      case 'poster':
                        return { fill: '#EC4899', stroke: '#DB2777' };
                      case 'mirror':
                        return { fill: '#06B6D4', stroke: '#0891B2' };
                      case 'tv':
                        return { fill: '#EF4444', stroke: '#DC2626' };
                      case 'artpiece':
                        return { fill: '#F59E0B', stroke: '#D97706' };
                      default:
                        return { fill: '#6B7280', stroke: '#4B5563' };
                    }
                  };

                  // Get abbreviated label for item type with count
                  const getItemTypeAbbrev = () => {
                    switch (item.type) {
                      case 'picture':
                        return 'P';
                      case 'poster':
                        return 'Po';
                      case 'mirror':
                        return 'M';
                      case 'tv':
                        return 'T';
                      case 'artpiece':
                        return 'A';
                      case 'shelf':
                        return 'S';
                      default:
                        return '?';
                    }
                  };

                  // Count items of same type that came before this one
                  const sameTypeIndex =
                    shelves.slice(0, index).filter((s) => s.type === item.type)
                      .length + 1;

                  const itemLabel = `${getItemTypeAbbrev()} ${sameTypeIndex}`;

                  const colors = getItemColor();
                  const itemHeight = item.height || 1;
                  const itemX = offsetX + item.distanceFromLeft * scale;
                  const itemY =
                    offsetY +
                    (wall.height - item.distanceFromFloor - itemHeight) * scale;
                  const itemWidth = item.width * scale;
                  const itemHeightScaled = itemHeight * scale;

                  // Determine if item is circular/oval based on shape
                  const isCircular =
                    item.type === 'mirror' &&
                    (item.shape === 'circle' || item.shape === 'oval');

                  return (
                    <g key={item.id}>
                      {isCircular ? (
                        // Render ellipse for circle/oval mirrors
                        <ellipse
                          cx={itemX + itemWidth / 2}
                          cy={itemY + itemHeightScaled / 2}
                          rx={itemWidth / 2}
                          ry={itemHeightScaled / 2}
                          fill={colors.fill}
                          stroke={colors.stroke}
                          strokeWidth='2'
                          opacity={item.type === 'shelf' ? 1 : 0.85}
                        />
                      ) : (
                        // Render rectangle for all other items
                        <rect
                          x={itemX}
                          y={itemY}
                          width={itemWidth}
                          height={itemHeightScaled}
                          fill={colors.fill}
                          stroke={colors.stroke}
                          strokeWidth='2'
                          rx='1'
                          opacity={item.type === 'shelf' ? 1 : 0.85}
                        />
                      )}
                      {showDetailedOverlays && (
                        <text
                          x={
                            offsetX +
                            (item.distanceFromLeft + item.width / 2) * scale
                          }
                          y={
                            offsetY +
                            (wall.height -
                              item.distanceFromFloor -
                              itemHeight / 2) *
                              scale
                          }
                          textAnchor='middle'
                          className='text-xs font-bold'
                          fill='white'
                          dominantBaseline='middle'
                        >
                          {itemLabel}
                        </text>
                      )}

                      {/* Weight/capacity badge */}
                      {(itemCapacity || item.weight) && showDetailedOverlays && (
                        <g>
                          <rect
                            x={
                              offsetX +
                              (item.distanceFromLeft + item.width - 3) * scale
                            }
                            y={
                              offsetY +
                              (wall.height -
                                item.distanceFromFloor -
                                itemHeight -
                                1.5) *
                                scale
                            }
                            width='52'
                            height='18'
                            fill='#1E40AF'
                            stroke='#1E3A8A'
                            strokeWidth='1'
                            rx='4'
                            opacity='0.95'
                          />
                          <text
                            x={
                              offsetX +
                              (item.distanceFromLeft + item.width - 3) * scale +
                              26
                            }
                            y={
                              offsetY +
                              (wall.height -
                                item.distanceFromFloor -
                                itemHeight -
                                1.5) *
                                scale +
                              9
                            }
                            textAnchor='middle'
                            dominantBaseline='middle'
                            className='text-xs font-bold'
                            fill='white'
                            fontSize='9'
                          >
                            {itemCapacity || item.weight || 0}lb
                          </text>
                        </g>
                      )}

                      {/* Item measurement lines */}
                      {showDetailedOverlays && (
                        <>
                          <line
                            x1={offsetX}
                            y1={
                              offsetY +
                              (wall.height - item.distanceFromFloor) * scale
                            }
                            x2={offsetX + item.distanceFromLeft * scale}
                            y2={
                              offsetY +
                              (wall.height - item.distanceFromFloor) * scale
                            }
                            stroke='#6B7280'
                            strokeWidth='1'
                            strokeDasharray='2,2'
                          />
                          <line
                            x1={offsetX + item.distanceFromLeft * scale}
                            y1={offsetY + scaledHeight}
                            x2={offsetX + item.distanceFromLeft * scale}
                            y2={
                              offsetY +
                              (wall.height - item.distanceFromFloor) * scale
                            }
                            stroke='#6B7280'
                            strokeWidth='1'
                            strokeDasharray='2,2'
                          />
                        </>
                      )}

                      {/* Bracket markers (for shelves only) */}
                      {item.type === 'shelf' &&
                        showDetailedOverlays &&
                        (() => {
                          // Derive brackets for this shelf using current settings
                          const perShelf =
                            calculateMaterials(
                              [item],
                              (wallMaterial as WallMaterial) || 'drywall',
                              (mountingType as MountingType) || 'floating',
                              { useStuds },
                            ).perShelf || [];
                          const bracketsForThisShelf =
                            perShelf[0]?.brackets || 2;
                          const bracketPositions =
                            perShelf[0]?.bracketPositions || [];

                          const positions: number[] = [];
                          for (let i = 0; i < bracketsForThisShelf; i++) {
                            // distribute across shelf width (centered positions)
                            const px =
                              item.distanceFromLeft +
                              (item.width * (i + 0.5)) / bracketsForThisShelf;
                            positions.push(px);
                          }

                          return (
                            <>
                              {positions.map((px, bi) => {
                                const isSelected = selectedShelfId === item.id;
                                const distanceFromEdge =
                                  bracketPositions[bi] ||
                                  (item.width * (bi + 0.5)) /
                                    bracketsForThisShelf;

                                return (
                                  <g
                                    key={`br-${item.id}-${bi}`}
                                    className={`bracket-marker group br-${item.id}`}
                                    data-shelf-id={item.id}
                                    onMouseEnter={() =>
                                      onHoverShelf && onHoverShelf(item.id)
                                    }
                                    onMouseLeave={() =>
                                      onHoverShelf && onHoverShelf(null)
                                    }
                                  >
                                    <line
                                      x1={offsetX + px * scale}
                                      y1={
                                        offsetY +
                                        (wall.height -
                                          item.distanceFromFloor -
                                          itemHeight) *
                                          scale
                                      }
                                      x2={offsetX + px * scale}
                                      y2={
                                        offsetY +
                                        (wall.height - item.distanceFromFloor) *
                                          scale
                                      }
                                      stroke={
                                        isSelected ? '#b45309' : '#111827'
                                      }
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
                                        (wall.height -
                                          item.distanceFromFloor -
                                          itemHeight / 2) *
                                          scale
                                      }
                                      r={isSelected ? 4 : 2}
                                      fill={isSelected ? '#b45309' : '#111827'}
                                      style={{
                                        transition:
                                          'r 220ms ease, fill 220ms ease',
                                        transformOrigin: 'center',
                                      }}
                                    />
                                    {/* Distance from left edge label */}
                                    {showBracketDetails && (
                                      <g>
                                        <rect
                                          x={offsetX + px * scale - 22}
                                          y={
                                            offsetY +
                                            (wall.height -
                                              item.distanceFromFloor -
                                              itemHeight / 2) *
                                              scale +
                                            8
                                          }
                                          width='44'
                                          height='14'
                                          fill='#F59E0B'
                                          stroke='#D97706'
                                          strokeWidth='1'
                                          rx='3'
                                          opacity='0.95'
                                        />
                                        <text
                                          x={offsetX + px * scale}
                                          y={
                                            offsetY +
                                            (wall.height -
                                              item.distanceFromFloor -
                                              itemHeight / 2) *
                                              scale +
                                            15
                                          }
                                          textAnchor='middle'
                                          dominantBaseline='middle'
                                          className='text-xs font-bold'
                                          fill='white'
                                          fontSize='8'
                                        >
                                          {distanceFromEdge.toFixed(1)}"
                                        </text>
                                      </g>
                                    )}
                                  </g>
                                );
                              })}
                              {/* Bracket spacing indicators */}
                              {showSpacing &&
                                positions.length > 1 &&
                                positions.map((px, bi) => {
                                  if (bi === positions.length - 1) return null;
                                  const nextPx = positions[bi + 1];
                                  const spacing = nextPx - px;
                                  const midX = (px + nextPx) / 2;
                                  const y =
                                    item.distanceFromFloor +
                                    (bi % 2 === 0 ? 6 : 9);

                                  return (
                                    <g key={`spacing-${item.id}-${bi}`}>
                                      {/* Spacing line */}
                                      <line
                                        x1={offsetX + px * scale}
                                        y1={offsetY + (wall.height - y) * scale}
                                        x2={offsetX + nextPx * scale}
                                        y2={offsetY + (wall.height - y) * scale}
                                        stroke='#6366F1'
                                        strokeWidth='1.5'
                                        strokeDasharray='3,2'
                                        opacity='0.7'
                                      />
                                      {/* Spacing measurement */}
                                      <rect
                                        x={offsetX + midX * scale - 20}
                                        y={
                                          offsetY +
                                          (wall.height - y) * scale -
                                          10
                                        }
                                        width='40'
                                        height='16'
                                        fill='#6366F1'
                                        rx='3'
                                        opacity='0.9'
                                      />
                                      <text
                                        x={offsetX + midX * scale}
                                        y={offsetY + (wall.height - y) * scale}
                                        textAnchor='middle'
                                        dominantBaseline='middle'
                                        className='text-xs font-semibold'
                                        fill='white'
                                        fontSize='9'
                                      >
                                        {spacing.toFixed(1)}"
                                      </text>
                                    </g>
                                  );
                                })}
                            </>
                          );
                        })()}
                    </g>
                  );
                })}
              </g>{' '}
              {/* End draggable wall group */}
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
            </svg>
          </div>

          {/* Alignment help and reset - shown when background photo is active */}

          {showSidebar && useBackgroundPhoto && onWallAlignmentChange && (
            <div className='mt-3 flex items-center justify-between gap-4 text-sm'>
              <div className='flex items-center gap-2 text-gray-600'>
                <span className='text-lg'>💡</span>
                <span>
                  Drag the wall rectangle to align with your photo. Use scroll
                  wheel to scale.
                </span>
              </div>
              <button
                onClick={() => {
                  // Reset to centered position in base container coordinates
                  onWallAlignmentChange(defaultX, defaultY, 1);
                }}
                className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors whitespace-nowrap'
              >
                Reset Position
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        {showSidebar && (
          <div className='w-full lg:w-64 space-y-4'>
            <div>
              <h3 className='font-semibold text-gray-900 mb-2'>Legend</h3>
              <div className='flex flex-wrap gap-2 text-sm'>
                <div className='flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1 rounded'>
                  <div className='w-4 h-4 bg-gray-100 border-2 border-gray-600 rounded'></div>
                  <span>Wall</span>
                </div>
                <div className='flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1 rounded'>
                  <div className='w-4 h-4 bg-green-600 rounded'></div>
                  <span>Shelves</span>
                </div>
                {enableStudDetection && studLocations.length > 0 && (
                  <div className='flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1 rounded'>
                    <div className='w-4 h-4 bg-yellow-300 border border-yellow-600 rounded'></div>
                    <span>Estimated studs ({studLocations.length})</span>
                  </div>
                )}
                <div className='flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1 rounded'>
                  <div className='w-4 h-4 bg-indigo-500 rounded'></div>
                  <span>Bracket Spacing</span>
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>
                Display Options
              </h4>
              <div className='flex flex-wrap gap-2'>
                {enableStudDetection && studLocations.length > 0 && (
                  <label className='inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 border border-gray-200 px-2 py-1.5 rounded transition-colors'>
                    <input
                      type='checkbox'
                      checked={showStuds}
                      onChange={(e) => setShowStuds(e.target.checked)}
                      className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                    />
                    <span>Show estimated stud locations</span>
                  </label>
                )}
                <label className='inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 border border-gray-200 px-2 py-1.5 rounded transition-colors'>
                  <input
                    type='checkbox'
                    checked={showBracketDetails}
                    onChange={(e) => setShowBracketDetails(e.target.checked)}
                    className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                  />
                  <span>Show bracket measurements</span>
                </label>
                <label className='inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 border border-gray-200 px-2 py-1.5 rounded transition-colors'>
                  <input
                    type='checkbox'
                    checked={showSpacing}
                    onChange={(e) => setShowSpacing(e.target.checked)}
                    className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                  />
                  <span>Show bracket spacing</span>
                </label>
              </div>
            </div>

            {obstructions.length > 0 && (
              <div>
                <h4 className='font-medium text-gray-900 mb-2'>Obstructions</h4>
                <div className='flex flex-wrap gap-2 text-sm'>
                  {Array.from(new Set(obstructions.map((o) => o.type))).map(
                    (type) => (
                      <div
                        key={type}
                        className='flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 py-1 rounded'
                      >
                        <div
                          className='w-4 h-4 rounded opacity-60'
                          style={{ backgroundColor: getObstructionColor(type) }}
                        ></div>
                        <span className='capitalize'>{type}</span>
                      </div>
                    ),
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
        )}
      </div>
    </div>
  );
}

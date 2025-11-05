import * as React from 'react';
import { Hammer, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ShelfPlacement,
  ProjectSettings,
  MaterialCalcOptions,
  PerShelfMaterial,
  WallDimensions,
  Obstruction,
  CalculationResult,
} from '../types';
import { calculateMaterials } from '../utils/calculations';
import {
  generateAllTemplates,
  generateComprehensivePDF,
  generatePanoramicDrillingTemplate,
} from '../utils/pdfTemplates';

interface MaterialCalculatorProps {
  placedShelves: ShelfPlacement[];
  settings: ProjectSettings;
  useStuds?: boolean;
  onToggleUseStuds?: (v: boolean) => void;
  selectedShelfId?: string | null;
  onSelectShelf?: (id: string) => void;
  onHoverShelf?: (id: string | null) => void;
  wall?: WallDimensions;
  obstructions?: Obstruction[];
  result?: CalculationResult;
}

export function MaterialCalculator({
  placedShelves,
  settings,
  useStuds = false,
  onToggleUseStuds,
  selectedShelfId,
  onSelectShelf,
  onHoverShelf,
  wall,
  obstructions = [],
  result,
}: MaterialCalculatorProps) {
  const [exporting, setExporting] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState<'A4' | 'Letter'>('Letter');

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!placedShelves || placedShelves.length === 0) return null;

  const options: MaterialCalcOptions = { useStuds };

  const estimate = calculateMaterials(
    placedShelves,
    settings.wallMaterial,
    settings.mountingType,
    options
  );

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
        <Hammer className='h-6 w-6 text-indigo-600' />
        Material Estimate
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-center'>
          <div className='text-sm text-indigo-700'>Brackets</div>
          <div className='text-2xl font-bold text-indigo-900'>
            {estimate.brackets}
          </div>
        </div>

        <div className='bg-green-50 border border-green-100 rounded-lg p-4 text-center'>
          <div className='text-sm text-green-700'>Screws</div>
          <div className='text-2xl font-bold text-green-900'>
            {estimate.screws}
          </div>
        </div>

        <div className='bg-amber-50 border border-amber-100 rounded-lg p-4 text-center'>
          <div className='text-sm text-amber-700'>Anchors</div>
          <div className='text-2xl font-bold text-amber-900'>
            {estimate.anchors}
          </div>
        </div>
      </div>

      {/* Load Capacity Display */}
      {estimate.maxWeightCapacity && (
        <div className='mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-5'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-sm font-medium text-blue-700 mb-1'>
                Total Maximum Safe Weight Capacity
              </div>
              <div className='text-3xl font-bold text-blue-900'>
                {estimate.maxWeightCapacity} lbs
              </div>
              <div className='text-xs text-blue-600 mt-1'>
                (combined capacity of all shelves with{' '}
                {Math.round((estimate.safetyFactor || 0.75) * 100)}% safety
                factor)
              </div>
              <div className='text-xs text-blue-500 mt-2'>
                ⬇️ See individual shelf capacities in the breakdown table below
              </div>
            </div>
            <div className='text-blue-400'>
              <svg
                className='w-16 h-16'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
                <path
                  fillRule='evenodd'
                  d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className='mt-4 flex items-center gap-3 flex-wrap'>
        <label className='text-sm font-medium'>PDF Size:</label>
        <select
          value={pdfPageSize}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setPdfPageSize(e.target.value as 'A4' | 'Letter')
          }
          className='border border-gray-300 p-2 rounded text-sm'
        >
          <option value='Letter'>Letter (US)</option>
          <option value='A4'>A4 (International)</option>
        </select>

        {exporting && (
          <div
            role='status'
            aria-live='polite'
            className='ml-2 flex items-center gap-2 text-sm text-gray-600'
          >
            <svg
              className='animate-spin h-4 w-4 text-gray-600'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
              ></path>
            </svg>
            <span>Exporting…</span>
          </div>
        )}

        <button
          disabled={exporting || !result}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors${
            exporting || !result ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={async () => {
            if (exporting || !wall || !result) return;
            setExporting(true);
            try {
              const container = document.getElementById(
                'schematic-container'
              ) as HTMLElement | null;
              if (!container) {
                alert('Schematic not found');
                return;
              }

              // Capture schematic
              /* eslint-disable @typescript-eslint/no-explicit-any */
              const html2canvasMod: any = await import('html2canvas');
              const html2canvas = html2canvasMod.default || html2canvasMod;
              const rect = container.getBoundingClientRect();
              const canvas = await html2canvas(container as HTMLElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                scrollX: -window.scrollX,
                scrollY: -window.scrollY,
                width: Math.ceil(rect.width),
                height: Math.ceil(rect.height),
              });
              /* eslint-enable @typescript-eslint/no-explicit-any */

              // Generate comprehensive PDF
              const blob = await generateComprehensivePDF(
                wall,
                placedShelves,
                obstructions,
                settings,
                estimate,
                result,
                canvas,
                pdfPageSize
              );

              // Download
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `shelf-installation-plan-${
                new Date().toISOString().split('T')[0]
              }.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error(err);
              alert('Export failed. Please try again.');
            } finally {
              setExporting(false);
            }
          }}
        >
          <FileText className='h-4 w-4' />
          Export Complete Plan (PDF)
        </button>

        <button
          disabled={exporting || !wall}
          className={`flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors${
            exporting || !wall ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={async () => {
            if (exporting || !wall) return;
            setExporting(true);
            try {
              const bracketsPerShelf = (estimate.perShelf || []).map(
                (ps) => ps.brackets
              );
              const bracketPositionsPerShelf = (estimate.perShelf || []).map(
                (ps) => ps.bracketPositions || []
              );
              const blob = await generateAllTemplates(
                placedShelves,
                wall,
                settings.unit,
                bracketsPerShelf,
                bracketPositionsPerShelf
              );

              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `drilling-templates-${
                new Date().toISOString().split('T')[0]
              }.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error(err);
              alert('Template generation failed');
            } finally {
              setExporting(false);
            }
          }}
        >
          <FileText className='h-4 w-4' />
          Drilling Templates (PDF)
        </button>

        <button
          disabled={exporting || !wall}
          className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors${
            exporting || !wall ? ' opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={async () => {
            if (exporting || !wall) return;
            setExporting(true);
            try {
              /* eslint-disable @typescript-eslint/no-explicit-any */
              const pdfLib: any = await import('pdf-lib');
              const { PDFDocument } = pdfLib;
              const pdfDoc = await PDFDocument.create();

              for (let i = 0; i < placedShelves.length; i++) {
                const bracketsCount =
                  (estimate.perShelf || [])[i]?.brackets || 2;
                const bracketPositions =
                  (estimate.perShelf || [])[i]?.bracketPositions || [];

                const templateBlob = await generatePanoramicDrillingTemplate(
                  placedShelves[i],
                  i + 1,
                  settings.unit,
                  bracketsCount,
                  bracketPositions
                );

                const templateBytes = await templateBlob.arrayBuffer();
                const templateDoc = await PDFDocument.load(templateBytes);
                const pages = await pdfDoc.copyPages(
                  templateDoc,
                  templateDoc.getPageIndices()
                );
                pages.forEach((page: any) => pdfDoc.addPage(page));
              }

              const pdfBytes = await pdfDoc.save();
              const blob = new Blob([pdfBytes], { type: 'application/pdf' });

              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `panoramic-templates-${
                new Date().toISOString().split('T')[0]
              }.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              /* eslint-enable @typescript-eslint/no-explicit-any */
            } catch (err) {
              console.error(err);
              alert('Panoramic template generation failed');
            } finally {
              setExporting(false);
            }
          }}
        >
          <FileText className='h-4 w-4' />
          Panoramic Templates (Multi-page)
        </button>
      </div>

      <div className='mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm'>
        <div className='font-medium mb-1'>Anchor Type</div>
        <div className='text-gray-700'>{estimate.anchorType}</div>
      </div>

      <div className='mt-4 flex items-center gap-4'>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={useStuds}
            onChange={(e) =>
              onToggleUseStuds && onToggleUseStuds(e.target.checked)
            }
            className='h-4 w-4'
          />
          Assume brackets will be mounted into studs (no anchors)
        </label>
      </div>

      {estimate.notes && (
        <div className='mt-4 text-xs text-gray-600'>{estimate.notes}</div>
      )}

      {/* Per-shelf breakdown */}
      {estimate.perShelf && (
        <div className='mt-6'>
          <h3 className='text-lg font-medium mb-2'>Per-shelf breakdown</h3>
          <div className='overflow-x-auto'>
            <table
              id='material-table'
              className='w-full text-sm text-left border-collapse'
            >
              <thead>
                <tr className='text-xs text-gray-500 bg-gray-50'>
                  <th className='p-2 border-b'>Shelf</th>
                  <th className='p-2 border-b'>Width</th>
                  <th className='p-2 border-b'>Brackets</th>
                  <th className='p-2 border-b'>Spacing</th>
                  <th className='p-2 border-b'>Screws</th>
                  <th className='p-2 border-b'>Anchors</th>
                  <th className='p-2 border-b font-semibold'>Max Weight</th>
                </tr>
              </thead>
              <tbody>
                {estimate.perShelf.map((row: PerShelfMaterial) => (
                  <tr
                    key={row.id}
                    className={`border-t cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedShelfId === row.id
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : ''
                    }`}
                    onClick={() => onSelectShelf && onSelectShelf(row.id)}
                    onMouseEnter={() => onHoverShelf && onHoverShelf(row.id)}
                    onMouseLeave={() => onHoverShelf && onHoverShelf(null)}
                  >
                    <td className='p-2'>{row.id}</td>
                    <td className='p-2'>{row.width}"</td>
                    <td className='p-2'>{row.brackets}</td>
                    <td className='p-2 text-indigo-600'>
                      {row.bracketSpacing ? `${row.bracketSpacing}"` : '-'}
                    </td>
                    <td className='p-2'>{row.screws}</td>
                    <td className='p-2'>{row.anchors}</td>
                    <td className='p-2 font-bold text-blue-700'>
                      {row.maxWeightCapacity ? (
                        <span className='inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded'>
                          {row.maxWeightCapacity} lbs
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
                <tr className='border-t-2 border-gray-300 font-semibold bg-gray-50'>
                  <td className='p-2'>TOTAL</td>
                  <td className='p-2'>-</td>
                  <td className='p-2'>{estimate.brackets}</td>
                  <td className='p-2'>-</td>
                  <td className='p-2'>{estimate.screws}</td>
                  <td className='p-2'>{estimate.anchors}</td>
                  <td className='p-2 font-bold text-blue-900'>
                    <span className='inline-flex items-center gap-1 bg-blue-200 px-2 py-1 rounded'>
                      {estimate.maxWeightCapacity} lbs
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='mt-3 text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200'>
            <strong>💡 Tip:</strong> Each shelf's weight capacity is calculated
            based on its specific width, number of brackets, and bracket
            spacing. Wider shelves with more brackets can support more weight.
            {useStuds && (
              <span className='text-blue-700 font-semibold'>
                {' '}
                Mounting into studs significantly increases capacity!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialCalculator;

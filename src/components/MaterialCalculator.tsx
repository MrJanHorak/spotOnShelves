import { Hammer } from 'lucide-react';
import {
  ShelfPlacement,
  ProjectSettings,
  MaterialCalcOptions,
  PerShelfMaterial,
} from '../types';
import { calculateMaterials } from '../utils/calculations';

interface MaterialCalculatorProps {
  placedShelves: ShelfPlacement[];
  settings: ProjectSettings;
  useStuds?: boolean;
  onToggleUseStuds?: (v: boolean) => void;
  selectedShelfId?: string | null;
  onSelectShelf?: (id: string) => void;
  onHoverShelf?: (id: string | null) => void;
}

export function MaterialCalculator({
  placedShelves,
  settings,
  useStuds = false,
  onToggleUseStuds,
  selectedShelfId,
  onSelectShelf,
  onHoverShelf,
}: MaterialCalculatorProps) {
  if (!placedShelves || placedShelves.length === 0) return null;

  const options: MaterialCalcOptions = { useStuds };

  const estimate = calculateMaterials(
    placedShelves,
    settings.wallMaterial,
    settings.mountingType,
    options
  );

  // Capture helper to ensure consistent html2canvas options for PNG/PDF
  const captureSchematic = async (scale: number) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const container = document.getElementById(
      'schematic-container'
    ) as HTMLElement | null;
    if (!container) throw new Error('Schematic not found');
    const html2canvasMod: any = await import('html2canvas');
    const html2canvas = html2canvasMod.default || html2canvasMod;
    const rect = container.getBoundingClientRect();
    // ensure we capture the container area exactly and account for page scroll
    const canvas = await html2canvas(container as HTMLElement, {
      backgroundColor: '#ffffff',
      scale,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      windowWidth: Math.max(
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth
      ),
      windowHeight: Math.max(
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight
      ),
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */
    return canvas as HTMLCanvasElement;
  };

  return (
    <div className='bg-white rounded-xl shadow-lg p-6'>
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

      {/* Export buttons */}
      <div className='mt-4 flex items-center gap-3'>
        <label className='text-sm'>Resolution</label>
        <select
          id='export-resolution'
          defaultValue='device'
          className='border p-1 rounded text-sm'
        >
          <option value='device'>Device DPR</option>
          <option value='1'>1x</option>
          <option value='2'>2x</option>
          <option value='3'>3x</option>
        </select>

        <button
          className='px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm'
          onClick={() => {
            const payload = {
              totals: {
                brackets: estimate.brackets,
                screws: estimate.screws,
                anchors: estimate.anchors,
                anchorType: estimate.anchorType,
              },
              perShelf: estimate.perShelf || [],
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'material-estimate.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          Export JSON
        </button>

        <button
          className='px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm'
          onClick={() => {
            const rows: string[][] = [];
            rows.push(['shelf_id', 'width', 'brackets', 'screws', 'anchors']);
            (estimate.perShelf || []).forEach((r) =>
              rows.push([
                r.id,
                String(r.width),
                String(r.brackets),
                String(r.screws),
                String(r.anchors),
              ])
            );
            rows.push([]);
            rows.push([
              'TOTAL',
              '',
              String(estimate.brackets),
              String(estimate.screws),
              String(estimate.anchors),
            ]);
            const csv = rows
              .map((r) =>
                r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
              )
              .join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'material-estimate.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </button>
        <button
          className='px-3 py-2 bg-white text-gray-800 rounded border hover:bg-gray-50 text-sm'
          onClick={async () => {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            // use html2canvas to capture the whole container (includes borders/background/grid)
            const container = document.getElementById(
              'schematic-container'
            ) as HTMLElement | null;
            if (!container) return alert('Schematic not found');

            const resSel = document.getElementById(
              'export-resolution'
            ) as HTMLSelectElement | null;
            let scale = window.devicePixelRatio || 1;
            if (resSel && resSel.value !== 'device')
              scale = Number(resSel.value) || 1;

            try {
              const canvas = await captureSchematic(scale);
              const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve)
              );
              if (!blob) return alert('Failed to create image');
              // filename with project and timestamp
              const projectName =
                (settings as any)?.name ||
                (settings as any)?.projectName ||
                'project';
              const ts = new Date().toISOString().replace(/[:.]/g, '-');
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${projectName}-schematic-${ts}@${scale}x.png`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error(err);
              alert('Export failed.');
            }
            /* eslint-enable @typescript-eslint/no-explicit-any */
          }}
        >
          Export PNG
        </button>

        <button
          className='px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm'
          onClick={async () => {
            // generate PDF via pdf-lib for precise image embedding
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const pdfLib: any = await import('pdf-lib');
            const { PDFDocument } = pdfLib;

            const container = document.getElementById('schematic-container') as HTMLElement | null;
            if (!container) return alert('Schematic not found');

            const resSel = document.getElementById('export-resolution') as HTMLSelectElement | null;
            let scale = window.devicePixelRatio || 1;
            if (resSel && resSel.value !== 'device') scale = Number(resSel.value) || 1;

            const canvas = await captureSchematic(scale);
            const pngDataUrl = canvas.toDataURL('image/png');
            const pngBuffer = await (await fetch(pngDataUrl)).arrayBuffer();

            // filename with project name and timestamp
            const projectName = ((settings as any)?.name || (settings as any)?.projectName) || 'project';
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${projectName}-schematic-${ts}.pdf`;


            // create pdf and embed png using canvas pixel dimensions so it matches the PNG
            const pdfDoc = await PDFDocument.create();
            const img = await pdfDoc.embedPng(pngBuffer);
            const pageW = canvas.width;
            const pageH = canvas.height;
            const page = pdfDoc.addPage([pageW, pageH]);
            page.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
          }}
        >
          Export PDF
        </button>
        <button
          className='px-3 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800 text-sm'
          onClick={async () => {
            // generate PDF-with-table via pdf-lib
            const pdfLib: any = await import('pdf-lib');
            const { PDFDocument, StandardFonts } = pdfLib;

            const container = document.getElementById('schematic-container') as HTMLElement | null;
            if (!container) return alert('Schematic not found');

            const resSel = document.getElementById('export-resolution') as HTMLSelectElement | null;
            let scale = window.devicePixelRatio || 1;
            if (resSel && resSel.value !== 'device') scale = Number(resSel.value) || 1;

            const canvas = await captureSchematic(scale);
            const pngDataUrl = canvas.toDataURL('image/png');
            const pngBuffer = await (await fetch(pngDataUrl)).arrayBuffer();

            const projectName = ((settings as any)?.name || (settings as any)?.projectName) || 'project';
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${projectName}-schematic-with-table-${ts}.pdf`;

            const pdfDoc = await PDFDocument.create();
            const img = await pdfDoc.embedPng(pngBuffer);
            const pageW = canvas.width;
            const pageH = canvas.height;

            const page1 = pdfDoc.addPage([pageW, pageH]);
            page1.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });

            // add second page for table (use same page size)
            const page2 = pdfDoc.addPage([pageW, pageH]);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const fontSizeTitle = 14;
            let y = pageH - 40;
            page2.drawText('Material Estimate', { x: 20, y, size: fontSizeTitle, font });
            y -= 30;

            const fontSize = 10;
            page2.drawText('Shelf ID', { x: 20, y, size: fontSize, font });
            page2.drawText('Width', { x: 160, y, size: fontSize, font });
            page2.drawText('Brackets', { x: 300, y, size: fontSize, font });
            page2.drawText('Screws', { x: 380, y, size: fontSize, font });
            page2.drawText('Anchors', { x: 460, y, size: fontSize, font });
            y -= 18;

            (estimate.perShelf || []).forEach((r: PerShelfMaterial) => {
              if (y < 40) {
                // new page
                pdfDoc.addPage([pageW, pageH]);
                y = pageH - 40;
              }
              page2.drawText(String(r.id), { x: 20, y, size: fontSize, font });
              page2.drawText(String(r.width), { x: 160, y, size: fontSize, font });
              page2.drawText(String(r.brackets), { x: 300, y, size: fontSize, font });
              page2.drawText(String(r.screws), { x: 380, y, size: fontSize, font });
              page2.drawText(String(r.anchors), { x: 460, y, size: fontSize, font });
              y -= 16;
            });

            // totals
            if (y < 40) {
              pdfDoc.addPage([pageW, pageH]);
              y = pageH - 40;
            }
            page2.drawText('TOTAL', { x: 20, y, size: fontSize, font });
            page2.drawText(String(estimate.brackets), { x: 300, y, size: fontSize, font });
            page2.drawText(String(estimate.screws), { x: 380, y, size: fontSize, font });
            page2.drawText(String(estimate.anchors), { x: 460, y, size: fontSize, font });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            /* eslint-enable @typescript-eslint/no-explicit-any */
          }}
        >
          Export PDF (with table)
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
            <table className='w-full text-sm text-left border-collapse'>
              <thead>
                <tr className='text-xs text-gray-500'>
                  <th className='p-2'>Shelf</th>
                  <th className='p-2'>Width</th>
                  <th className='p-2'>Brackets</th>
                  <th className='p-2'>Screws</th>
                  <th className='p-2'>Anchors</th>
                </tr>
              </thead>
              <tbody>
                {estimate.perShelf.map((row: PerShelfMaterial) => (
                  <tr
                    key={row.id}
                    className={`border-t cursor-pointer ${
                      selectedShelfId === row.id ? 'bg-yellow-50' : ''
                    }`}
                    onClick={() => onSelectShelf && onSelectShelf(row.id)}
                    onMouseEnter={() => onHoverShelf && onHoverShelf(row.id)}
                    onMouseLeave={() => onHoverShelf && onHoverShelf(null)}
                  >
                    <td className='p-2'>{row.id}</td>
                    <td className='p-2'>{row.width + '"'}</td>
                    <td className='p-2'>{row.brackets}</td>
                    <td className='p-2'>{row.screws}</td>
                    <td className='p-2'>{row.anchors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialCalculator;

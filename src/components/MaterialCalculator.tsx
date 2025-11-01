import { useState } from 'react';
import { Hammer } from 'lucide-react';
import { ShelfPlacement, ProjectSettings, MaterialCalcOptions, PerShelfMaterial } from '../types';
import { calculateMaterials } from '../utils/calculations';

interface MaterialCalculatorProps {
  placedShelves: ShelfPlacement[];
  settings: ProjectSettings;
}

export function MaterialCalculator({
  placedShelves,
  settings,
}: MaterialCalculatorProps) {
  const [useStuds, setUseStuds] = useState(false);

  if (!placedShelves || placedShelves.length === 0) return null;

  const options: MaterialCalcOptions = { useStuds };

  const estimate = calculateMaterials(
    placedShelves,
    settings.wallMaterial,
    settings.mountingType,
    options
  );

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
      <div className='mt-4 flex gap-3'>
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
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
            (estimate.perShelf || []).forEach(r => rows.push([r.id, String(r.width), String(r.brackets), String(r.screws), String(r.anchors)]));
            rows.push([]);
            rows.push(['TOTAL', '', String(estimate.brackets), String(estimate.screws), String(estimate.anchors)]);
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
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
            onChange={(e) => setUseStuds(e.target.checked)}
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
                  <tr key={row.id} className='border-t'>
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

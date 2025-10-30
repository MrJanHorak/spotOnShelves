import { Hammer } from 'lucide-react';
import { ShelfPlacement, ProjectSettings, MaterialEstimate } from '../types';
import { calculateMaterials } from '../utils/calculations';

interface MaterialCalculatorProps {
  placedShelves: ShelfPlacement[];
  settings: ProjectSettings;
}

export function MaterialCalculator({ placedShelves, settings }: MaterialCalculatorProps) {
  if (!placedShelves || placedShelves.length === 0) return null;

  const estimate: MaterialEstimate = calculateMaterials(placedShelves, settings.wallMaterial, settings.mountingType);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Hammer className="h-6 w-6 text-indigo-600" />
        Material Estimate
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-center">
          <div className="text-sm text-indigo-700">Brackets</div>
          <div className="text-2xl font-bold text-indigo-900">{estimate.brackets}</div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
          <div className="text-sm text-green-700">Screws</div>
          <div className="text-2xl font-bold text-green-900">{estimate.screws}</div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
          <div className="text-sm text-amber-700">Anchors</div>
          <div className="text-2xl font-bold text-amber-900">{estimate.anchors}</div>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
        <div className="font-medium mb-1">Anchor Type</div>
        <div className="text-gray-700">{estimate.anchorType}</div>
      </div>

      {estimate.notes && (
        <div className="mt-4 text-xs text-gray-600">{estimate.notes}</div>
      )}
    </div>
  );
}

export default MaterialCalculator;

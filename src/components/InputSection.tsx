import React from 'react';
import { Plus, X, Home, Move } from 'lucide-react';
import { WallDimensions, ShelfDimensions, Obstruction, ProjectSettings, ObstructionType, Unit, WallMaterial, MountingType, Alignment } from '../types';

interface InputSectionProps {
  wall: WallDimensions;
  shelves: ShelfDimensions[];
  obstructions: Obstruction[];
  settings: ProjectSettings;
  onWallChange: (wall: WallDimensions) => void;
  onShelvesChange: (shelves: ShelfDimensions[]) => void;
  onObstructionsChange: (obstructions: Obstruction[]) => void;
  onSettingsChange: (settings: ProjectSettings) => void;
}

const obstructionTypes: { value: ObstructionType; label: string }[] = [
  { value: 'bed', label: 'Bed' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'door', label: 'Door' },
  { value: 'window', label: 'Window' },
  { value: 'tv', label: 'TV' },
  { value: 'other', label: 'Other' }
];

export function InputSection({
  wall,
  shelves,
  obstructions,
  settings,
  onWallChange,
  onShelvesChange,
  onObstructionsChange,
  onSettingsChange
}: InputSectionProps) {
  const addShelf = () => {
    const newShelf: ShelfDimensions = {
      id: `shelf-${Date.now()}`,
      width: 24,
      depth: 8
    };
    onShelvesChange([...shelves, newShelf]);
  };

  const removeShelf = (id: string) => {
    onShelvesChange(shelves.filter(shelf => shelf.id !== id));
  };

  const updateShelf = (id: string, updates: Partial<ShelfDimensions>) => {
    onShelvesChange(shelves.map(shelf => 
      shelf.id === id ? { ...shelf, ...updates } : shelf
    ));
  };

  const addObstruction = () => {
    const newObstruction: Obstruction = {
      id: `obstruction-${Date.now()}`,
      type: 'cabinet',
      width: 30,
      height: 60,
      distanceFromLeft: 0,
      distanceFromFloor: 0
    };
    onObstructionsChange([...obstructions, newObstruction]);
  };

  const removeObstruction = (id: string) => {
    onObstructionsChange(obstructions.filter(obstruction => obstruction.id !== id));
  };

  const updateObstruction = (id: string, updates: Partial<Obstruction>) => {
    onObstructionsChange(obstructions.map(obstruction => 
      obstruction.id === id ? { ...obstruction, ...updates } : obstruction
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
      {/* Project Settings */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Home className="h-6 w-6 text-blue-600" />
          Project Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
            <select 
              value={settings.unit} 
              onChange={(e) => onSettingsChange({ ...settings, unit: e.target.value as Unit })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="inches">Inches</option>
              <option value="cm">Centimeters</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wall Material</label>
            <select 
              value={settings.wallMaterial} 
              onChange={(e) => onSettingsChange({ ...settings, wallMaterial: e.target.value as WallMaterial })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="drywall">Drywall</option>
              <option value="plaster">Plaster</option>
              <option value="concrete">Concrete</option>
              <option value="brick">Brick</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mounting Type</label>
            <select 
              value={settings.mountingType} 
              onChange={(e) => onSettingsChange({ ...settings, mountingType: e.target.value as MountingType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="floating">Floating Shelf</option>
              <option value="bracketed">Bracketed Shelf</option>
              <option value="l-bracket">L-Bracket</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alignment</label>
            <select 
              value={settings.alignment} 
              onChange={(e) => onSettingsChange({ ...settings, alignment: e.target.value as Alignment })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="left">Left Aligned</option>
              <option value="center">Center Aligned</option>
              <option value="right">Right Aligned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wall Dimensions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Wall Dimensions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width ({settings.unit === 'inches' ? 'in' : 'cm'})
            </label>
            <input
              type="number"
              value={wall.width}
              onChange={(e) => onWallChange({ ...wall, width: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter wall width"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height ({settings.unit === 'inches' ? 'in' : 'cm'})
            </label>
            <input
              type="number"
              value={wall.height}
              onChange={(e) => onWallChange({ ...wall, height: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter wall height"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Shelves */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Shelves</h3>
          <button
            onClick={addShelf}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Shelf
          </button>
        </div>
        <div className="space-y-4">
          {shelves.map((shelf, index) => (
            <div key={shelf.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Shelf {index + 1}</h4>
                <button
                  onClick={() => removeShelf(shelf.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type="number"
                    value={shelf.width}
                    onChange={(e) => updateShelf(shelf.id, { width: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depth ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type="number"
                    value={shelf.depth}
                    onChange={(e) => updateShelf(shelf.id, { depth: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          ))}
          {shelves.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No shelves added yet. Click "Add Shelf" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Obstructions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Wall Obstructions</h3>
          <button
            onClick={addObstruction}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Obstruction
          </button>
        </div>
        <div className="space-y-4">
          {obstructions.map((obstruction, index) => (
            <div key={obstruction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {obstruction.type.charAt(0).toUpperCase() + obstruction.type.slice(1)} {index + 1}
                </h4>
                <button
                  onClick={() => removeObstruction(obstruction.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={obstruction.type}
                    onChange={(e) => updateObstruction(obstruction.id, { type: e.target.value as ObstructionType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {obstructionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type="number"
                    value={obstruction.width}
                    onChange={(e) => updateObstruction(obstruction.id, { width: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type="number"
                    value={obstruction.height}
                    onChange={(e) => updateObstruction(obstruction.id, { height: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance from Left ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type="number"
                    value={obstruction.distanceFromLeft}
                    onChange={(e) => updateObstruction(obstruction.id, { distanceFromLeft: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Distance from Floor ({settings.unit === 'inches' ? 'in' : 'cm'})
                  </label>
                  <input
                    type="number"
                    value={obstruction.distanceFromFloor}
                    onChange={(e) => updateObstruction(obstruction.id, { distanceFromFloor: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          ))}
          {obstructions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No obstructions added. Your wall is clear!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
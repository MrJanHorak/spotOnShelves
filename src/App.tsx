import React, { useState, useEffect } from 'react';
import { AlertCircle, Calculator } from 'lucide-react';
import { InputSection } from './components/InputSection';
import { SchematicDisplay } from './components/SchematicDisplay';
import { MeasurementOutput } from './components/MeasurementOutput';
import { ToolsAndGuidance } from './components/ToolsAndGuidance';
import {
  WallDimensions,
  ShelfDimensions,
  Obstruction,
  ProjectSettings,
  CalculationResult,
} from './types';
import {
  validateInputs,
  calculateOptimalPlacement,
} from './utils/calculations';
import { MaterialCalculator } from './components/MaterialCalculator';
import boltLogo from './assets/black_circle_360x360.png';

function App() {
  const [wall, setWall] = useState<WallDimensions>({ width: 96, height: 96 });
  const [shelves, setShelves] = useState<ShelfDimensions[]>([
    { id: 'shelf-1', width: 36, depth: 8 },
    { id: 'shelf-2', width: 24, depth: 6 },
  ]);
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [settings, setSettings] = useState<ProjectSettings>({
    unit: 'inches',
    wallMaterial: 'drywall',
    mountingType: 'floating',
    alignment: 'center',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<CalculationResult>({
    shelves: [],
    measurements: [],
    instructions: [],
  });

  useEffect(() => {
    const validationErrors = validateInputs(wall, shelves, obstructions);
    setErrors(validationErrors);

    if (validationErrors.length === 0 && shelves.length > 0) {
      const calculationResult = calculateOptimalPlacement(
        wall,
        shelves,
        obstructions,
        settings.alignment
      );
      setResult(calculationResult);
    } else {
      setResult({ shelves: [], measurements: [], instructions: [] });
    }
  }, [wall, shelves, obstructions, settings.alignment]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-600 rounded-lg'>
                <Calculator className='h-8 w-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Spot On Shelves
                </h1>
                <p className='text-gray-600'>
                  Plan and hang shelves with precision and confidence
                </p>
              </div>
            </div>
            <a
              href='https://bolt.new/'
              target='_blank'
              rel='noopener noreferrer'
            >
              <img
                src={boltLogo}
                alt='Built with bolt.new'
                className='h-16 w-16'
              />
            </a>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Error Display */}
        {errors.length > 0 && (
          <div className='mb-8 bg-red-50 border border-red-200 rounded-xl p-4'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div>
                <h3 className='font-semibold text-red-900 mb-2'>
                  Please fix the following issues:
                </h3>
                <ul className='space-y-1'>
                  {errors.map((error, index) => (
                    <li key={index} className='text-red-800 text-sm'>
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-8'>
          {/* Input Section */}
          <InputSection
            wall={wall}
            shelves={shelves}
            obstructions={obstructions}
            settings={settings}
            onWallChange={setWall}
            onShelvesChange={setShelves}
            onObstructionsChange={setObstructions}
            onSettingsChange={setSettings}
          />

          {/* Results Section */}
          {errors.length === 0 && result.shelves.length > 0 && (
            <>
              {/* Schematic Display */}
              <SchematicDisplay
                wall={wall}
                obstructions={obstructions}
                shelves={result.shelves}
                unit={settings.unit}
              />

              {/* Measurement Output */}
              <MeasurementOutput result={result} unit={settings.unit} />

              {/* Material Calculator */}
              <MaterialCalculator placedShelves={result.shelves} settings={settings} />
            </>
          )}

          {/* Tools and Guidance */}
          <ToolsAndGuidance settings={settings} />
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-gray-900 text-white mt-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center'>
            <p className='text-gray-400 text-sm'>
              Spot On Shelves - Your trusted companion for precise shelf
              installation
            </p>
            <p className='text-gray-500 text-xs mt-2'>
              Always prioritize safety and consult professionals for complex
              installations
            </p>
            <p className='text-gray-500 text-xs mt-2'>
              Built with <a href='https://bolt.new/'>bolt.new</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

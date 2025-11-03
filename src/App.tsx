import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calculator,
  Save,
  FolderOpen,
  Download,
  Upload,
} from 'lucide-react';
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
  WallItem,
} from './types';
import {
  validateInputs,
  calculateOptimalPlacement,
  calculateStudLocations,
  calculateWallItemPlacement,
} from './utils/calculations';
import { MaterialCalculator } from './components/MaterialCalculator';
import {
  saveProject,
  getAllProjects,
  getProject,
  deleteProject,
  exportProjectAsJSON,
  importProjectFromJSON,
  SavedProject,
} from './utils/storage';
import boltLogo from './assets/black_circle_360x360.png';

function App() {
  const [wall, setWall] = useState<WallDimensions>({ width: 96, height: 96 });
  const [shelves, setShelves] = useState<(ShelfDimensions | WallItem)[]>([
    { id: 'shelf-1', type: 'shelf', width: 36, height: 1, depth: 8 },
    { id: 'shelf-2', type: 'shelf', width: 24, height: 1, depth: 6 },
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
  const [useStuds, setUseStuds] = useState<boolean>(false);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [hoveredShelfId, setHoveredShelfId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] =
    useState<string>('Untitled Project');
  const [showLoadDialog, setShowLoadDialog] = useState<boolean>(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  // Load saved projects on mount
  useEffect(() => {
    setSavedProjects(getAllProjects());
  }, []);

  useEffect(() => {
    // Split items into shelves and wall items for validation
    const shelvesOnly = shelves.filter(
      (item): item is ShelfDimensions => item.type === 'shelf'
    );
    const validationErrors = validateInputs(wall, shelvesOnly, obstructions);
    setErrors(validationErrors);

    if (validationErrors.length === 0 && shelves.length > 0) {
      // Calculate stud locations if enabled
      const studLocs = settings.enableStudDetection
        ? settings.customStudLocations &&
          settings.customStudLocations.length > 0
          ? settings.customStudLocations
          : calculateStudLocations(
              wall.width,
              settings.studSpacing || 16,
              settings.studSpacing || 16
            )
        : undefined;

      // Check if we have any wall items (pictures, etc.)
      const hasWallItems = shelves.some((item) => item.type !== 'shelf');

      let calculationResult: CalculationResult;
      if (hasWallItems) {
        // Use the new calculation function that handles both shelves and wall items
        calculationResult = calculateWallItemPlacement(
          wall,
          shelves,
          obstructions,
          settings.alignment,
          settings.galleryLayout || 'custom',
          settings.eyeLevelHeight || 57
        );
      } else {
        // Use the original shelf-only calculation
        calculationResult = calculateOptimalPlacement(
          wall,
          shelvesOnly,
          obstructions,
          settings.alignment,
          studLocs
        );
      }
      setResult(calculationResult);
    } else {
      setResult({ shelves: [], measurements: [], instructions: [] });
    }
  }, [
    wall,
    shelves,
    obstructions,
    settings.alignment,
    settings.enableStudDetection,
    settings.studSpacing,
    settings.customStudLocations,
    settings.galleryLayout,
    settings.eyeLevelHeight,
  ]);

  const handleSaveProject = () => {
    const name = prompt('Enter project name:', currentProjectName);
    if (name) {
      const project = saveProject(name, wall, shelves, obstructions, settings);
      setCurrentProjectId(project.id);
      setCurrentProjectName(name);
      setSavedProjects(getAllProjects());
      alert('Project saved successfully!');
    }
  };

  const handleLoadProject = (projectId: string) => {
    const project = getProject(projectId);
    if (project) {
      setWall(project.wall);
      setShelves(project.shelves);
      setObstructions(project.obstructions);
      setSettings(project.settings);
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setShowLoadDialog(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
      setSavedProjects(getAllProjects());
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setCurrentProjectName('Untitled Project');
      }
    }
  };

  const handleExportProject = () => {
    if (currentProjectId) {
      const project = getProject(currentProjectId);
      if (project) {
        exportProjectAsJSON(project);
      }
    } else {
      // Create temporary project for export
      const temp = saveProject(
        currentProjectName,
        wall,
        shelves,
        obstructions,
        settings
      );
      exportProjectAsJSON(temp);
      deleteProject(temp.id);
    }
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const project = importProjectFromJSON(content);
          if (project) {
            setSavedProjects(getAllProjects());
            handleLoadProject(project.id);
            alert('Project imported successfully!');
          } else {
            alert('Failed to import project. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

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
            <div className='flex items-center gap-2'>
              <button
                onClick={handleSaveProject}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                title='Save current project'
              >
                <Save className='h-4 w-4' />
                <span className='hidden sm:inline'>Save</span>
              </button>
              <button
                onClick={() => setShowLoadDialog(true)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                title='Load saved project'
              >
                <FolderOpen className='h-4 w-4' />
                <span className='hidden sm:inline'>Load</span>
              </button>
              <button
                onClick={handleExportProject}
                className='flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
                title='Export project as JSON'
              >
                <Download className='h-4 w-4' />
                <span className='hidden sm:inline'>Export</span>
              </button>
              <button
                onClick={handleImportProject}
                className='flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
                title='Import project from JSON'
              >
                <Upload className='h-4 w-4' />
                <span className='hidden sm:inline'>Import</span>
              </button>
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
          {currentProjectName && (
            <div className='mt-2 text-sm text-gray-600'>
              Current project:{' '}
              <span className='font-semibold'>{currentProjectName}</span>
            </div>
          )}
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
                wallMaterial={settings.wallMaterial}
                mountingType={settings.mountingType}
                useStuds={useStuds}
                selectedShelfId={hoveredShelfId || selectedShelfId}
                onHoverShelf={(id) => setHoveredShelfId(id)}
                studSpacing={settings.studSpacing}
                customStudLocations={settings.customStudLocations}
                enableStudDetection={settings.enableStudDetection}
              />

              {/* Measurement Output */}
              <MeasurementOutput
                result={result}
                unit={settings.unit}
                wallMaterial={settings.wallMaterial}
                mountingType={settings.mountingType}
                useStuds={useStuds}
              />

              {/* Material Calculator */}
              <MaterialCalculator
                placedShelves={result.shelves}
                settings={settings}
                useStuds={useStuds}
                onToggleUseStuds={setUseStuds}
                selectedShelfId={selectedShelfId}
                onSelectShelf={(id) =>
                  setSelectedShelfId((prev) => (prev === id ? null : id))
                }
                onHoverShelf={(id) => setHoveredShelfId(id)}
                wall={wall}
                obstructions={obstructions}
                result={result}
              />
            </>
          )}

          {/* Tools and Guidance */}
          <ToolsAndGuidance settings={settings} />
        </div>
      </main>

      {/* Load Project Dialog */}
      {showLoadDialog && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
          <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden'>
            <div className='p-6 border-b'>
              <h2 className='text-2xl font-bold text-gray-900'>Load Project</h2>
            </div>
            <div className='p-6 overflow-y-auto max-h-[60vh]'>
              {savedProjects.length === 0 ? (
                <p className='text-gray-600 text-center py-8'>
                  No saved projects yet. Save your current project to see it
                  here.
                </p>
              ) : (
                <div className='space-y-3'>
                  {savedProjects.map((project) => (
                    <div
                      key={project.id}
                      className='border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-gray-900'>
                            {project.name}
                          </h3>
                          <p className='text-sm text-gray-600 mt-1'>
                            {project.shelves.length} shelf(s),{' '}
                            {project.obstructions.length} obstruction(s)
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            Saved: {new Date(project.savedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className='flex gap-2 ml-4'>
                          <button
                            onClick={() => handleLoadProject(project.id)}
                            className='px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm'
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className='px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm'
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className='p-6 border-t bg-gray-50'>
              <button
                onClick={() => setShowLoadDialog(false)}
                className='w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

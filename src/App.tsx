import { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Calculator,
  Save,
  FolderOpen,
  Download,
  Upload,
  Settings,
  Ruler,
  Hammer,
  BookOpen,
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
  checkItemObstructionConflicts,
  checkPlacedItemConflicts,
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

function App() {
  const [wall, setWall] = useState<WallDimensions>({ width: 96, height: 96 });
  const [shelves, setShelves] = useState<(ShelfDimensions | WallItem)[]>([
    { id: 'shelf-1', type: 'shelf', width: 36, height: 1, depth: 8 },
  ]);
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [settings, setSettings] = useState<ProjectSettings>({
    unit: 'inches',
    wallMaterial: 'drywall',
    mountingType: 'floating',
    alignment: 'center',
    autoArrange: true,
    snapToGrid: true,
    gridSize: 1,
    minSpacing: 2,
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
  const [activeTab, setActiveTab] = useState<
    'setup' | 'measurements' | 'materials' | 'guidance'
  >('setup');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isSchematicCompact, setIsSchematicCompact] = useState(false);

  // Load saved projects on mount
  useEffect(() => {
    setSavedProjects(getAllProjects());
  }, []);

  useEffect(() => {
    if (result.shelves.length === 0) {
      setIsSchematicCompact(false);
    }

    const rootEl = scrollContainerRef.current;
    const sentinelEl = sentinelRef.current;
    if (!rootEl || !sentinelEl) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSchematicCompact(!entry.isIntersecting);
      },
      {
        root: rootEl,
        rootMargin: '-135px 0px 0px 0px',
        threshold: 0.75,
      }
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [result.shelves.length]);

  useEffect(() => {
    // Split items into shelves and wall items for validation
    const shelvesOnly = shelves.filter(
      (item): item is ShelfDimensions => item.type === 'shelf'
    );
    const validationErrors = validateInputs(wall, shelvesOnly, obstructions);

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
          settings.eyeLevelHeight || 57,
          settings.autoArrange ?? true,
          settings.minSpacing ?? 6,
          settings.horizontalSpacing,
          settings.verticalSpacing
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

      // Check for conflicts between placed items and obstructions
      if (calculationResult.shelves.length > 0) {
        const conflictErrors = checkItemObstructionConflicts(
          calculationResult.shelves,
          obstructions
        );
        validationErrors.push(...conflictErrors);

        // Also check for item-to-item conflicts
        const itemConflictErrors = checkPlacedItemConflicts(
          calculationResult.shelves
        );
        validationErrors.push(...itemConflictErrors);
      }

      setResult(calculationResult);
    } else {
      setResult({ shelves: [], measurements: [], instructions: [] });
    }

    setErrors(validationErrors);
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
    settings.autoArrange,
    settings.minSpacing,
    settings.horizontalSpacing,
    settings.verticalSpacing,
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

      <main className='flex flex-col h-[calc(100vh-9rem)]'>
        <div ref={scrollContainerRef} className='flex-1 overflow-y-auto'>
          <div className='min-h-full pb-16'>
            {result.shelves.length > 0 && (
              <>
                <section
                  className={`sticky top-0 z-30 border-b border-gray-200 transition-all duration-300 ${
                    isSchematicCompact
                      ? 'bg-white/95 backdrop-blur-sm py-3'
                      : 'bg-white py-6'
                  }`}
                >
                  <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
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
                      backgroundImage={settings.backgroundImage}
                      backgroundOpacity={settings.backgroundOpacity}
                      useBackgroundPhoto={settings.useBackgroundPhoto}
                      wallAlignmentX={settings.wallAlignmentX}
                      wallAlignmentY={settings.wallAlignmentY}
                      wallScaleFactor={settings.wallScaleFactor || 1}
                      onWallAlignmentChange={(x, y, scale) =>
                        setSettings((prev) => ({
                          ...(prev || {}),
                          wallAlignmentX: x,
                          wallAlignmentY: y,
                          wallScaleFactor: scale,
                        }))
                      }
                      isCompact={isSchematicCompact}
                    />
                    {/* MOVED: Tab headers live in the sticky area so they stay visible */}
                    <div className='mt-4'>
                      <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
                        <div
                          className={`flex border-b border-gray-200 bg-gray-50 ${
                            isSchematicCompact ? 'mt-6=-2px' : ''
                          }`}
                        >
                          <button
                            onClick={() => setActiveTab('setup')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              activeTab === 'setup'
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <Settings className='h-4 w-4' />
                            Setup & Configuration
                          </button>
                          <button
                            onClick={() => setActiveTab('measurements')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              activeTab === 'measurements'
                                ? 'bg-white text-green-600 border-b-2 border-green-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            disabled={
                              result.shelves.length === 0 || errors.length > 0
                            }
                          >
                            <Ruler className='h-4 w-4' />
                            Measurements & Instructions
                          </button>
                          <button
                            onClick={() => setActiveTab('materials')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              activeTab === 'materials'
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            disabled={
                              result.shelves.length === 0 || errors.length > 0
                            }
                          >
                            <Hammer className='h-4 w-4' />
                            Materials & Export
                          </button>
                          <button
                            onClick={() => setActiveTab('guidance')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                              activeTab === 'guidance'
                                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <BookOpen className='h-4 w-4' />
                            Tools & Guidance
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <div
                  ref={sentinelRef}
                  aria-hidden='true'
                  className='h-px w-full'
                />
              </>
            )}

            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
              {/* Error Display */}
              {errors.length > 0 && (
                <div className='mb-8 bg-red-50 border border-red-200 rounded-xl p-4'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <h3 className='font-semibold text-red-900 mb-2'>
                        Please fix the following issues:
                      </h3>
                      <ul className='space-y-1 mb-3'>
                        {errors.map((error, index) => (
                          <li key={index} className='text-red-800 text-sm'>
                            • {error}
                          </li>
                        ))}
                      </ul>
                      <div className='mt-3 pt-3 border-t border-red-200'>
                        <p className='text-sm text-red-700 font-medium mb-2'>
                          💡 How to fix overlaps:
                        </p>
                        <ul className='text-xs text-red-700 space-y-1 ml-4'>
                          <li>
                            • Use the <strong>Position Controls</strong> below
                            each item to manually adjust positions
                          </li>
                          <li>
                            • Check the <strong>Wall Schematic</strong> above to
                            see where items overlap
                          </li>
                          <li>
                            • Click the <strong>lock icon 🔓</strong> to enable
                            manual positioning for a specific item
                          </li>
                          <li>
                            • Or uncheck <strong>"Auto-arrange items"</strong>{' '}
                            in Project Settings to position all items manually
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabbed Interface (headers are in the sticky schematic) */}
              <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
                {/* Tab Content */}
                <div className='p-4'>
                  {activeTab === 'setup' && (
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
                  )}

                  {activeTab === 'measurements' &&
                    result.shelves.length > 0 &&
                    errors.length === 0 && (
                      <MeasurementOutput
                        result={result}
                        unit={settings.unit}
                        wallMaterial={settings.wallMaterial}
                        mountingType={settings.mountingType}
                        useStuds={useStuds}
                      />
                    )}

                  {activeTab === 'materials' &&
                    result.shelves.length > 0 &&
                    errors.length === 0 && (
                      <MaterialCalculator
                        placedShelves={result.shelves}
                        settings={settings}
                        useStuds={useStuds}
                        onToggleUseStuds={setUseStuds}
                        selectedShelfId={selectedShelfId}
                        onSelectShelf={(id) =>
                          setSelectedShelfId((prev) =>
                            prev === id ? null : id
                          )
                        }
                        onHoverShelf={(id) => setHoveredShelfId(id)}
                        wall={wall}
                        obstructions={obstructions}
                        result={result}
                      />
                    )}

                  {activeTab === 'guidance' && (
                    <ToolsAndGuidance settings={settings} />
                  )}
                </div>
              </div>
            </div>
          </div>
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

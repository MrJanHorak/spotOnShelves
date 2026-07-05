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
  HelpCircle,
} from 'lucide-react';
import { InputSection } from './components/InputSection';
import { SchematicDisplay } from './components/SchematicDisplay';
import { MeasurementOutput } from './components/MeasurementOutput';
import { ToolsAndGuidance } from './components/ToolsAndGuidance';
import TermsOfService from './components/TermsOfService';
import { HelpGuideModal } from './components/modals/HelpGuideModal';
import {
  DeleteProjectDialog,
  LoadProjectDialog,
  SaveProjectDialog,
  ToastMessage,
} from './components/modals/ProjectDialogs';
import {
  WallDimensions,
  ShelfDimensions,
  Obstruction,
  ProjectSettings,
  CalculationResult,
  WallItem,
  Unit,
} from './types';
import {
  validateInputs,
  calculateOptimalPlacement,
  calculateStudLocations,
  calculateWallItemPlacement,
  checkItemObstructionConflicts,
  checkPlacedItemConflicts,
  convertUnits,
} from './utils/calculations';
import { MaterialCalculator } from './components/MaterialCalculator';
import {
  saveProject,
  updateProject,
  getAllProjects,
  getProject,
  deleteProject,
  exportProjectAsJSON,
  importProjectFromJSON,
  SavedProject,
} from './utils/storage';
import { getDefaultUnitForStandard } from './utils/obstructionStandards';
import { detectObstructionStandardFromBrowser } from './utils/localeDefaults';
import { reportAppError } from './utils/errorReporting';

function toUnitValue(valueInches: number, unit: Unit): number {
  if (unit === 'cm') return Math.round(valueInches * 2.54 * 10) / 10;
  return valueInches;
}

const GA_MEASUREMENT_ID = 'G-5BZ8KVWKBB';
const QUICK_START_DISMISSED_KEY = 'spotOnShelves_quickStartDismissed';
const COOKIE_CONSENT_KEY = 'spotOnShelves_cookieConsent_v1';
type CookieConsentChoice = 'accepted' | 'declined';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __spotOnGaConfigured?: boolean;
  }
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

function readCookieConsentChoice(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw === 'accepted' || raw === 'declined' ? raw : null;
  } catch {
    return null;
  }
}

function applyAnalyticsConsent(choice: CookieConsentChoice) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const analyticsGranted = choice === 'accepted';
  window.gtag('consent', 'update', {
    analytics_storage: analyticsGranted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  if (analyticsGranted && !window.__spotOnGaConfigured) {
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
    window.__spotOnGaConfigured = true;
  }
}

function App() {
  const detectedStandard = detectObstructionStandardFromBrowser();
  const defaultUnit = getDefaultUnitForStandard(detectedStandard);
  const [wall, setWall] = useState<WallDimensions>({
    width: toUnitValue(96, defaultUnit),
    height: toUnitValue(96, defaultUnit),
  });
  const [shelves, setShelves] = useState<(ShelfDimensions | WallItem)[]>([
    {
      id: 'shelf-1',
      type: 'shelf',
      width: toUnitValue(36, defaultUnit),
      height: toUnitValue(1, defaultUnit),
      depth: toUnitValue(8, defaultUnit),
    },
  ]);
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [settings, setSettings] = useState<ProjectSettings>({
    unit: defaultUnit,
    wallMaterial: 'drywall',
    mountingType: 'floating',
    alignment: 'center',
    noUtilityZonesConfirmed: false,
    obstructionStandard: detectedStandard,
    autoUnitByStandard: true,
    studSpacing: toUnitValue(16, defaultUnit),
    firstStudOffset: toUnitValue(16, defaultUnit),
    autoArrange: true,
    snapToGrid: true,
    gridSize: toUnitValue(1, defaultUnit),
    minSpacing: toUnitValue(2, defaultUnit),
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
  const lastScrollTopRef = useRef(0);
  const compactLockUntilRef = useRef(0);
  const userScrollIntentUntilRef = useRef(0);
  const [isSchematicCompact, setIsSchematicCompact] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(
    !readStoredBoolean(QUICK_START_DISMISSED_KEY, false),
  );
  const [cookieConsentChoice, setCookieConsentChoice] =
    useState<CookieConsentChoice | null>(() => readCookieConsentChoice());
  const [showCookieBanner, setShowCookieBanner] = useState(
    cookieConsentChoice === null,
  );
  const isHeaderCompact = true;
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveProjectNameDraft, setSaveProjectNameDraft] = useState('');
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<
    string | null
  >(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const hasUtilityObstruction = obstructions.some((o) =>
    ['outlet', 'switch', 'plumbing'].includes(o.type),
  );
  const hasUtilitySafetyCoverage =
    hasUtilityObstruction || Boolean(settings.noUtilityZonesConfirmed);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const convertDimension = (value: number, from: Unit, to: Unit): number =>
    Math.round(convertUnits(value, from, to) * 10) / 10;

  const convertProjectMeasurements = (from: Unit, to: Unit) => {
    setWall((prev) => ({
      width: convertDimension(prev.width, from, to),
      height: convertDimension(prev.height, from, to),
    }));

    setShelves((prev) =>
      prev.map((item) => {
        const baseItem = {
          ...item,
          width: convertDimension(item.width, from, to),
          height: convertDimension(item.height, from, to),
          manualPosition: item.manualPosition
            ? {
                distanceFromLeft: convertDimension(
                  item.manualPosition.distanceFromLeft,
                  from,
                  to,
                ),
                distanceFromFloor: convertDimension(
                  item.manualPosition.distanceFromFloor,
                  from,
                  to,
                ),
              }
            : undefined,
        };

        if (item.type === 'shelf') {
          return {
            ...baseItem,
            depth: convertDimension(item.depth, from, to),
          } as ShelfDimensions;
        }

        return {
          ...baseItem,
          frameDepth:
            typeof item.frameDepth === 'number'
              ? convertDimension(item.frameDepth, from, to)
              : item.frameDepth,
        } as WallItem;
      }),
    );

    setObstructions((prev) =>
      prev.map((obstruction) => ({
        ...obstruction,
        width: convertDimension(obstruction.width, from, to),
        height: convertDimension(obstruction.height, from, to),
        distanceFromLeft: convertDimension(
          obstruction.distanceFromLeft,
          from,
          to,
        ),
        distanceFromFloor: convertDimension(
          obstruction.distanceFromFloor,
          from,
          to,
        ),
      })),
    );
  };

  const convertSettingsMeasurements = (
    nextSettings: ProjectSettings,
    from: Unit,
    to: Unit,
  ): ProjectSettings => ({
    ...nextSettings,
    studSpacing:
      typeof nextSettings.studSpacing === 'number'
        ? convertDimension(nextSettings.studSpacing, from, to)
        : nextSettings.studSpacing,
    firstStudOffset:
      typeof nextSettings.firstStudOffset === 'number'
        ? convertDimension(nextSettings.firstStudOffset, from, to)
        : nextSettings.firstStudOffset,
    customStudLocations: nextSettings.customStudLocations?.map((value) =>
      convertDimension(value, from, to),
    ),
    eyeLevelHeight:
      typeof nextSettings.eyeLevelHeight === 'number'
        ? convertDimension(nextSettings.eyeLevelHeight, from, to)
        : nextSettings.eyeLevelHeight,
    gridSize:
      typeof nextSettings.gridSize === 'number'
        ? convertDimension(nextSettings.gridSize, from, to)
        : nextSettings.gridSize,
    minSpacing:
      typeof nextSettings.minSpacing === 'number'
        ? convertDimension(nextSettings.minSpacing, from, to)
        : nextSettings.minSpacing,
    horizontalSpacing:
      typeof nextSettings.horizontalSpacing === 'number'
        ? convertDimension(nextSettings.horizontalSpacing, from, to)
        : nextSettings.horizontalSpacing,
    verticalSpacing:
      typeof nextSettings.verticalSpacing === 'number'
        ? convertDimension(nextSettings.verticalSpacing, from, to)
        : nextSettings.verticalSpacing,
  });

  const handleSettingsChange = (nextSettings: ProjectSettings) => {
    const from = settings.unit;
    const to = nextSettings.unit;
    if (from !== to) {
      convertProjectMeasurements(from, to);
      setSettings(convertSettingsMeasurements(nextSettings, from, to));
      return;
    }
    setSettings(nextSettings);
  };

  // Load saved projects on mount
  useEffect(() => {
    setSavedProjects(getAllProjects());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        QUICK_START_DISMISSED_KEY,
        String(!showQuickStart),
      );
    } catch {
      // ignore storage failures
    }
  }, [showQuickStart]);

  useEffect(() => {
    if (!cookieConsentChoice) return;
    applyAnalyticsConsent(cookieConsentChoice);
  }, [cookieConsentChoice]);

  const handleCookieConsent = (choice: CookieConsentChoice) => {
    setCookieConsentChoice(choice);
    setShowCookieBanner(false);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch {
      // ignore storage failures
    }
  };

  useEffect(() => {
    const anyDialogOpen =
      showTerms ||
      showHelpGuide ||
      showSaveDialog ||
      showLoadDialog ||
      Boolean(pendingDeleteProjectId);
    if (!anyDialogOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showSaveDialog) setShowSaveDialog(false);
      else if (pendingDeleteProjectId) setPendingDeleteProjectId(null);
      else if (showLoadDialog) setShowLoadDialog(false);
      else if (showHelpGuide) setShowHelpGuide(false);
      else if (showTerms) setShowTerms(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showTerms,
    showHelpGuide,
    showSaveDialog,
    showLoadDialog,
    pendingDeleteProjectId,
  ]);

  useEffect(() => {
    if (result.shelves.length === 0) {
      setIsSchematicCompact(false);
      lastScrollTopRef.current = 0;
      compactLockUntilRef.current = 0;
      userScrollIntentUntilRef.current = 0;
      return;
    }

    const rootEl = scrollContainerRef.current;
    if (!rootEl) {
      return;
    }

    const ENTER_COMPACT_SCROLL_TOP = 240;
    const EXIT_COMPACT_SCROLL_TOP = 24;
    const TOGGLE_LOCK_MS = 450;
    const USER_INTENT_WINDOW_MS = 900;

    const markUserScrollIntent = () => {
      userScrollIntentUntilRef.current = performance.now() + USER_INTENT_WINDOW_MS;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (
        key === 'ArrowDown' ||
        key === 'ArrowUp' ||
        key === 'PageDown' ||
        key === 'PageUp' ||
        key === 'Home' ||
        key === 'End' ||
        key === ' ' ||
        key === 'Spacebar'
      ) {
        markUserScrollIntent();
      }
    };

    const updateCompactMode = () => {
      const now = performance.now();
      if (now > userScrollIntentUntilRef.current) {
        lastScrollTopRef.current = rootEl.scrollTop;
        return;
      }
      if (now < compactLockUntilRef.current) return;

      const scrollTop = rootEl.scrollTop;
      const isScrollingDown = scrollTop > lastScrollTopRef.current;
      const isScrollingUp = scrollTop < lastScrollTopRef.current;
      lastScrollTopRef.current = scrollTop;

      setIsSchematicCompact((prev) => {
        if (!prev && isScrollingDown && scrollTop > ENTER_COMPACT_SCROLL_TOP) {
          compactLockUntilRef.current = now + TOGGLE_LOCK_MS;
          return true;
        }
        if (prev && isScrollingUp && scrollTop < EXIT_COMPACT_SCROLL_TOP) {
          compactLockUntilRef.current = now + TOGGLE_LOCK_MS;
          return false;
        }
        return prev;
      });
    };

    lastScrollTopRef.current = rootEl.scrollTop;
    updateCompactMode();
    rootEl.addEventListener('wheel', markUserScrollIntent, { passive: true });
    rootEl.addEventListener('touchstart', markUserScrollIntent, {
      passive: true,
    });
    rootEl.addEventListener('touchmove', markUserScrollIntent, {
      passive: true,
    });
    rootEl.addEventListener('pointerdown', markUserScrollIntent, {
      passive: true,
    });
    window.addEventListener('keydown', onKeyDown);
    rootEl.addEventListener('scroll', updateCompactMode, { passive: true });

    return () => {
      rootEl.removeEventListener('wheel', markUserScrollIntent);
      rootEl.removeEventListener('touchstart', markUserScrollIntent);
      rootEl.removeEventListener('touchmove', markUserScrollIntent);
      rootEl.removeEventListener('pointerdown', markUserScrollIntent);
      window.removeEventListener('keydown', onKeyDown);
      rootEl.removeEventListener('scroll', updateCompactMode);
    };
  }, [result.shelves.length]);

  useEffect(() => {
    // Split items into shelves and wall items for validation
    const shelvesOnly = shelves.filter(
      (item): item is ShelfDimensions => item.type === 'shelf',
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
              settings.firstStudOffset ?? settings.studSpacing ?? 16,
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
          settings.eyeLevelHeight ?? (settings.unit === 'cm' ? 144.8 : 57),
          settings.autoArrange ?? true,
          settings.minSpacing ?? 6,
          settings.horizontalSpacing,
          settings.verticalSpacing,
          settings.gridDistributeEvenly ?? false,
          settings.wallMaterial,
        );
      } else {
        // Use the original shelf-only calculation
        calculationResult = calculateOptimalPlacement(
          wall,
          shelvesOnly,
          obstructions,
          settings.alignment,
          studLocs,
        );
      }

      // Check for conflicts between placed items and obstructions
      if (calculationResult.shelves.length > 0) {
        const conflictErrors = checkItemObstructionConflicts(
          calculationResult.shelves,
          obstructions,
        );
        validationErrors.push(...conflictErrors);

        // Also check for item-to-item conflicts
        const itemConflictErrors = checkPlacedItemConflicts(
          calculationResult.shelves,
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
    settings.firstStudOffset,
    settings.customStudLocations,
    settings.galleryLayout,
    settings.eyeLevelHeight,
    settings.autoArrange,
    settings.minSpacing,
    settings.horizontalSpacing,
    settings.verticalSpacing,
    settings.gridDistributeEvenly,
    settings.wallMaterial,
  ]);

  const saveProjectWithName = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      try {
        let project: SavedProject | null = null;
        if (currentProjectId) {
          project = updateProject(currentProjectId, {
            name: trimmedName,
            wall,
            shelves,
            obstructions,
            settings,
          });
        }
        if (!project) {
          project = saveProject(
            trimmedName,
            wall,
            shelves,
            obstructions,
            settings,
          );
        }

        setCurrentProjectId(project.id);
        setCurrentProjectName(trimmedName);
        setSavedProjects(getAllProjects());
        showToast('Project saved successfully.', 'success');
        setShowSaveDialog(false);
      } catch (error) {
        reportAppError(error, {
          scope: 'save-project',
          details: {
            currentProjectId,
            shelvesCount: shelves.length,
            obstructionsCount: obstructions.length,
          },
        });
        showToast(
          'Failed to save project. Local storage may be full (try removing large background photos).',
          'error',
        );
      }
    }
  };

  const handleSaveProject = () => {
    setSaveProjectNameDraft(currentProjectName);
    setShowSaveDialog(true);
  };

  const handleLoadProject = (projectId: string) => {
    const project = getProject(projectId);
    if (project) {
      setWall(project.wall);
      setShelves(project.shelves);
      setObstructions(project.obstructions);
      const resolvedStandard =
        project.settings.obstructionStandard ??
        detectObstructionStandardFromBrowser();
      const autoUnitByStandard = project.settings.autoUnitByStandard ?? true;
      const resolvedUnit =
        project.settings.unit ?? getDefaultUnitForStandard(resolvedStandard);
      setSettings({
        ...project.settings,
        obstructionStandard: resolvedStandard,
        autoUnitByStandard,
        unit: resolvedUnit,
        noUtilityZonesConfirmed: project.settings.noUtilityZonesConfirmed ?? false,
      });
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setShowLoadDialog(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setPendingDeleteProjectId(projectId);
  };

  const confirmDeleteProject = () => {
    if (!pendingDeleteProjectId) return;
    deleteProject(pendingDeleteProjectId);
    setSavedProjects(getAllProjects());
    if (currentProjectId === pendingDeleteProjectId) {
      setCurrentProjectId(null);
      setCurrentProjectName('Untitled Project');
    }
    setPendingDeleteProjectId(null);
    showToast('Project deleted.', 'success');
  };

  const handleExportProject = () => {
    if (currentProjectId) {
      const project = getProject(currentProjectId);
      if (project) {
        exportProjectAsJSON(project);
        showToast('Project exported as JSON.', 'success');
      }
    } else {
      try {
        // Create temporary project for export
        const temp = saveProject(
          currentProjectName,
          wall,
          shelves,
          obstructions,
          settings,
        );
        exportProjectAsJSON(temp);
        deleteProject(temp.id);
        showToast('Project exported as JSON.', 'success');
      } catch (error) {
        reportAppError(error, {
          scope: 'export-project',
          details: {
            hasCurrentProject: Boolean(currentProjectId),
            shelvesCount: shelves.length,
          },
        });
        showToast(
          'Failed to export project. Please save without a large background image and try again.',
          'error',
        );
      }
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
          try {
            const project = importProjectFromJSON(content);
            if (project) {
              setSavedProjects(getAllProjects());
              handleLoadProject(project.id);
              showToast('Project imported successfully.', 'success');
            } else {
              showToast(
                'Failed to import project. Please check the file format.',
                'error',
              );
            }
          } catch (error) {
            reportAppError(error, {
              scope: 'import-project',
              details: {
                fileName: file.name,
              },
            });
            showToast(
              'Failed to import project. Local storage may be full or unavailable.',
              'error',
            );
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const prepareSchematicExport = async () => {
    const wasCompact = isSchematicCompact;
    if (wasCompact) {
      setIsSchematicCompact(false);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }
    return () => {
      if (wasCompact) {
        setIsSchematicCompact(true);
      }
    };
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
            isHeaderCompact ? 'py-2.5' : 'py-4'
          }`}
        >
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <div className='flex items-center gap-3'>
              <div
                className={`bg-blue-600 rounded-lg ${
                  isHeaderCompact ? 'p-1.5' : 'p-2'
                }`}
              >
                <Calculator
                  className={`${isHeaderCompact ? 'h-6 w-6' : 'h-7 w-7'} text-white`}
                />
              </div>
              <div>
                <h1
                  className={`font-bold text-gray-900 leading-tight ${
                    isHeaderCompact ? 'text-2xl' : 'text-[1.75rem]'
                  }`}
                >
                  Spot On Shelves
                </h1>
                <p
                  className={`text-sm text-gray-600 hidden lg:block ${
                    isHeaderCompact ? '' : 'mt-0.5'
                  }`}
                >
                  Plan and hang shelves with precision and confidence
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 flex-wrap justify-end'>
              {currentProjectName && (
                <span className='max-w-[220px] truncate px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700'>
                  Project: {currentProjectName}
                </span>
              )}
              <button
                onClick={handleSaveProject}
                className='flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
                title='Save current project'
              >
                <Save className='h-4 w-4' />
                <span className='hidden sm:inline'>Save</span>
              </button>
              <button
                onClick={() => setShowLoadDialog(true)}
                className='flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                title='Load saved project'
              >
                <FolderOpen className='h-4 w-4' />
                <span className='hidden sm:inline'>Load</span>
              </button>
              <button
                onClick={handleExportProject}
                className='flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
                title='Export project as JSON'
              >
                <Download className='h-4 w-4' />
                <span className='hidden sm:inline'>Export</span>
              </button>
              <button
                onClick={handleImportProject}
                className='flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
                title='Import project from JSON'
              >
                <Upload className='h-4 w-4' />
                <span className='hidden sm:inline'>Import</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className='flex flex-col h-[calc(100vh-7.5rem)]'>
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
                      firstStudOffset={settings.firstStudOffset}
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
                          className={`flex overflow-x-auto border-b border-gray-200 bg-gray-50 ${
                            isSchematicCompact ? 'mt-6 -mt-[2px]' : ''
                          }`}
                        >
                          <button
                            onClick={() => setActiveTab('setup')}
                            className={`min-w-[12rem] sm:flex-1 px-4 sm:px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
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
                            className={`min-w-[12rem] sm:flex-1 px-4 sm:px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
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
                            className={`min-w-[12rem] sm:flex-1 px-4 sm:px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
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
                            className={`min-w-[12rem] sm:flex-1 px-4 sm:px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
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
              </>
            )}

            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
              {showQuickStart && (
                <div className='mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-start justify-between gap-3'>
                  <p className='text-sm text-blue-900'>
                    <strong>Quick start:</strong> 1) Set wall size and material
                    2) Add shelves/items and obstructions 3) Use Measurements
                    for your marking guide.
                  </p>
                  <button
                    type='button'
                    onClick={() => setShowQuickStart(false)}
                    className='text-blue-700 hover:text-blue-900 text-sm font-medium'
                    aria-label='Dismiss quick start'
                  >
                    Dismiss
                  </button>
                </div>
              )}

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

              {errors.length === 0 && !hasUtilitySafetyCoverage && (
                <div className='mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4'>
                  <p className='text-sm text-amber-900'>
                    <strong>Safety reminder:</strong> No outlet/switch/plumbing
                    zones are marked yet. Add them as obstructions before
                    drilling.
                  </p>
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
                      onSettingsChange={handleSettingsChange}
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
                            prev === id ? null : id,
                          )
                        }
                        onHoverShelf={(id) => setHoveredShelfId(id)}
                        wall={wall}
                        obstructions={obstructions}
                        result={result}
                        onPrepareSchematicExport={prepareSchematicExport}
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

      <LoadProjectDialog
        open={showLoadDialog}
        savedProjects={savedProjects}
        onClose={() => setShowLoadDialog(false)}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Footer */}
      <footer className='bg-gray-900 text-white mt-16 border-t border-gray-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6'>
          <div className='text-center md:text-left flex-1'>
            <div className='flex items-center justify-center md:justify-start gap-4 mb-3'>
              <a
                href='https://github.com/MrJanHorak'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='GitHub profile'
                className='hover:text-blue-400 transition-colors flex items-center gap-1'
              >
                <svg
                  className='inline h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path d='M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.262.793-.583 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.921.43.37.823 1.102.823 2.222 0 1.606-.015 2.902-.015 3.297 0 .324.192.7.8.581C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z' />
                </svg>
                <span className='text-sm font-medium'>GitHub</span>
              </a>
              <a
                href='https://www.linkedin.com/in/jan-horak/'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='LinkedIn profile'
                className='hover:text-blue-400 transition-colors flex items-center gap-1'
              >
                <svg
                  className='inline h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path d='M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.88v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z' />
                </svg>
                <span className='text-sm font-medium'>LinkedIn</span>
              </a>
            </div>
            <p className='text-gray-400 text-sm'>
              Spot On Shelves &copy; {new Date().getFullYear()}.
            </p>
            <p className='text-gray-500 text-xs mt-2'>
              This site is provided for informational purposes only. Always
              prioritize safety and consult professionals for complex
              installations.
            </p>
            <p className='text-gray-500 text-xs mt-2'>
              Built with{' '}
              <a
                href='https://bolt.new/'
                className='underline hover:text-blue-300'
              >
                bolt.new
              </a>
            </p>
          </div>
          <div className='mt-6 md:mt-0 text-center md:text-right flex-1'>
            <p className='text-gray-400 text-xs mb-2 font-semibold tracking-wide uppercase'>
              Legal & Privacy
            </p>
            <p className='text-gray-500 text-xs'>
              This site stores project data locally in your browser. Optional
              anonymous usage analytics are only enabled if you accept the
              analytics cookie consent prompt.
            </p>
            <p className='text-gray-500 text-xs mt-2'>
              By using this site, you agree to the{' '}
              <button
                type='button'
                className='underline hover:text-blue-300 bg-transparent border-0 p-0 m-0 cursor-pointer inline'
                onClick={() => setShowTerms(true)}
                aria-label='View Terms of Service'
              >
                Terms of Service
              </button>
              .
            </p>
          </div>
        </div>
      </footer>

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60'>
          <div
            className='bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 relative animate-fadeInUp'
            role='dialog'
            aria-modal='true'
            aria-labelledby='terms-modal-title'
          >
            <h2 id='terms-modal-title' className='sr-only'>
              Terms of Service
            </h2>
            <button
              onClick={() => setShowTerms(false)}
              className='absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold focus:outline-none'
              aria-label='Close Terms of Service'
            >
              &times;
            </button>
            <TermsOfService />
          </div>
        </div>
      )}

      <HelpGuideModal open={showHelpGuide} onClose={() => setShowHelpGuide(false)} />

      <SaveProjectDialog
        open={showSaveDialog}
        projectName={saveProjectNameDraft}
        onChangeProjectName={setSaveProjectNameDraft}
        onClose={() => setShowSaveDialog(false)}
        onSave={() => saveProjectWithName(saveProjectNameDraft)}
      />

      <DeleteProjectDialog
        open={Boolean(pendingDeleteProjectId)}
        onClose={() => setPendingDeleteProjectId(null)}
        onDelete={confirmDeleteProject}
      />

      {showCookieBanner && (
        <div className='fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[min(42rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white shadow-2xl p-4'>
          <p className='text-sm text-gray-900'>
            We use Google Analytics to understand feature usage and improve the
            app. Analytics stays off unless you accept.
          </p>
          <div className='mt-2 text-xs text-gray-600'>
            You can review our{' '}
            <button
              type='button'
              onClick={() => setShowTerms(true)}
              className='underline hover:text-gray-800'
            >
              Terms of Service
            </button>{' '}
            for privacy details.
          </div>
          <div className='mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end'>
            <button
              type='button'
              onClick={() => handleCookieConsent('declined')}
              className='px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium'
            >
              Decline analytics
            </button>
            <button
              type='button'
              onClick={() => handleCookieConsent('accepted')}
              className='px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium'
            >
              Accept analytics
            </button>
          </div>
        </div>
      )}

      {toast && <ToastMessage message={toast.message} type={toast.type} />}

      {/* Floating Help Button */}
      <button
        type='button'
        onClick={() => setShowHelpGuide(true)}
        className='fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center'
        aria-label='Open how-to guide'
        aria-haspopup='dialog'
        title='How to use this app'
      >
        <HelpCircle className='h-6 w-6' />
      </button>
    </div>
  );
}

export default App;

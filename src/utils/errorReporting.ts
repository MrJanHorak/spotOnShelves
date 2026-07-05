type ErrorContext = {
  scope: 'save-project' | 'export-project' | 'import-project' | 'storage';
  details?: Record<string, unknown>;
};

export function reportAppError(error: unknown, context: ErrorContext): void {
  const payload = {
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
  };

  console.error('SpotOnShelves error report:', payload, error);
}

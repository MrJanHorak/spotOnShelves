import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled app error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStoredProjects = () => {
    try {
      window.localStorage.removeItem('spotOnShelves_projects');
      window.localStorage.removeItem('spotOnShelves_currentProject');
    } catch (error) {
      console.error('Failed to clear stored project data:', error);
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center p-6'>
        <div className='max-w-xl w-full bg-white border border-red-200 rounded-xl shadow-sm p-6'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-6 w-6 text-red-600 mt-0.5' />
            <div>
              <h1 className='text-lg font-semibold text-gray-900'>
                Something went wrong
              </h1>
              <p className='text-sm text-gray-700 mt-2'>
                The app hit an unexpected error. You can reload the page, or
                reset saved project data if the issue is caused by corrupted
                local storage.
              </p>
            </div>
          </div>

          <div className='mt-5 flex flex-col sm:flex-row gap-2'>
            <button
              onClick={this.handleReload}
              className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700'
            >
              <RefreshCcw className='h-4 w-4' />
              Reload app
            </button>
            <button
              onClick={this.handleResetStoredProjects}
              className='px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            >
              Reset local project data
            </button>
          </div>
        </div>
      </div>
    );
  }
}

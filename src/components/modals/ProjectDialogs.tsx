import { SavedProject } from '../../utils/storage';

interface LoadProjectDialogProps {
  open: boolean;
  savedProjects: SavedProject[];
  onClose: () => void;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export function LoadProjectDialog({
  open,
  savedProjects,
  onClose,
  onLoadProject,
  onDeleteProject,
}: LoadProjectDialogProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div
        className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden'
        role='dialog'
        aria-modal='true'
        aria-labelledby='load-project-title'
      >
        <div className='p-6 border-b'>
          <h2 id='load-project-title' className='text-2xl font-bold text-gray-900'>
            Load Project
          </h2>
        </div>
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          {savedProjects.length === 0 ? (
            <p className='text-gray-600 text-center py-8'>
              No saved projects yet. Save your current project to see it here.
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
                      <h3 className='font-semibold text-gray-900'>{project.name}</h3>
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
                        onClick={() => onLoadProject(project.id)}
                        className='px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm'
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDeleteProject(project.id)}
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
            onClick={onClose}
            className='w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface SaveProjectDialogProps {
  open: boolean;
  projectName: string;
  onChangeProjectName: (name: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function SaveProjectDialog({
  open,
  projectName,
  onChangeProjectName,
  onClose,
  onSave,
}: SaveProjectDialogProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div
        className='bg-white rounded-xl shadow-2xl max-w-md w-full'
        role='dialog'
        aria-modal='true'
        aria-labelledby='save-project-title'
      >
        <div className='p-6 border-b'>
          <h2 id='save-project-title' className='text-xl font-bold text-gray-900'>
            Save Project
          </h2>
        </div>
        <div className='p-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Project name
          </label>
          <input
            type='text'
            value={projectName}
            onChange={(e) => onChangeProjectName(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
            placeholder='Enter project name'
            autoFocus
          />
        </div>
        <div className='p-6 border-t bg-gray-50 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className='flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteProjectDialog({
  open,
  onClose,
  onDelete,
}: DeleteProjectDialogProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div
        className='bg-white rounded-xl shadow-2xl max-w-md w-full'
        role='dialog'
        aria-modal='true'
        aria-labelledby='delete-project-title'
      >
        <div className='p-6 border-b'>
          <h2 id='delete-project-title' className='text-xl font-bold text-gray-900'>
            Delete Project?
          </h2>
        </div>
        <div className='p-6 text-sm text-gray-700'>This action cannot be undone.</div>
        <div className='p-6 border-t bg-gray-50 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastMessageProps {
  message: string;
  type: 'success' | 'error';
}

export function ToastMessage({ message, type }: ToastMessageProps) {
  return (
    <div className='fixed bottom-20 right-4 z-50'>
      <div
        className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
          type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {message}
      </div>
    </div>
  );
}

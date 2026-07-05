interface HelpGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpGuideModal({ open, onClose }: HelpGuideModalProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
      <div
        className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto'
        role='dialog'
        aria-modal='true'
        aria-labelledby='help-guide-title'
      >
        <div className='p-6 border-b flex items-center justify-between'>
          <h2 id='help-guide-title' className='text-xl font-bold text-gray-900'>
            How to Use Spot On Shelves
          </h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700 text-2xl font-bold'
            aria-label='Close help guide'
          >
            &times;
          </button>
        </div>
        <div className='p-6 space-y-4 text-sm text-gray-700'>
          <p className='text-gray-800'>
            <strong>First-time setup checklist</strong>
          </p>
          <ol className='list-decimal pl-5 space-y-3'>
            <li>
              <strong>Start in Setup & Configuration.</strong> Choose units, wall
              material, mounting type, and alignment. If your wall includes
              outlets/switches/plumbing, select the obstruction standard closest
              to your region.
            </li>
            <li>
              <strong>Enter accurate wall size.</strong> Measure total wall width
              and height first; everything else is positioned against these values.
            </li>
            <li>
              <strong>Add your items.</strong> Add shelves and/or wall art one at
              a time. For best recommendations, enter each item&apos;s real weight
              when known. If weight is blank, the app will label guidance as
              estimated.
            </li>
            <li>
              <strong>Mark obstructions before drilling.</strong> Add doors,
              windows, beds, cabinets, and utility zones (outlets/switches/
              plumbing). This prevents invalid placements and improves safety.
            </li>
            <li>
              <strong>Check the schematic and warnings.</strong> If you see overlap
              warnings, adjust size/position or use manual positioning until
              conflicts are gone.
            </li>
            <li>
              <strong>Use Measurements tab to mark the wall.</strong> Follow it
              top-to-bottom: left offset, floor offset, then bracket
              spacing/positions. Mark in pencil first, then re-check level and
              clearances before drilling.
            </li>
            <li>
              <strong>Use Materials & Export for install prep.</strong> Review
              capacity/hardware guidance, then export the PDF plan or drilling
              templates.
            </li>
          </ol>

          <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2'>
            <p className='text-gray-900'>
              <strong>Worked example (quick sanity check)</strong>
            </p>
            <p>
              36&quot; floating shelf on drywall, 2 brackets, about 18&quot; spacing
              should land near <strong>52 lb safe capacity</strong>. If your value
              is much higher, verify wall material, mounting type, and spacing.
            </p>
          </div>

          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3 space-y-1 text-yellow-900'>
            <p>
              <strong>Before drilling:</strong> Use a real stud finder and
              detector. The app can estimate stud spacing, but it cannot see
              hidden wires, pipes, or blocked framing behind drywall.
            </p>
            <p>
              Keep a conservative safety margin if item weight is uncertain or
              anchors are used instead of studs.
            </p>
          </div>

          <div className='rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-900'>
            <strong>Pro tip:</strong> Background photo tools are optional. Leave
            that section collapsed unless you want visual alignment against a real
            wall photo.
          </div>
        </div>
      </div>
    </div>
  );
}

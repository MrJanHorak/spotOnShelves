import React from 'react';
import { Ruler, CheckCircle } from 'lucide-react';
import { CalculationResult, Unit } from '../types';
import { formatMeasurement } from '../utils/calculations';

interface MeasurementOutputProps {
  result: CalculationResult;
  unit: Unit;
}

export function MeasurementOutput({ result, unit }: MeasurementOutputProps) {
  if (result.shelves.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Ruler className="h-6 w-6 text-green-600" />
        Precise Measurements
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Measurements */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shelf Positions</h3>
          <div className="space-y-3">
            {result.shelves.map((shelf, index) => (
              <div key={shelf.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Shelf {index + 1}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">From left wall:</span>
                    <div className="font-semibold text-green-800">
                      {formatMeasurement(shelf.distanceFromLeft, unit)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">From floor:</span>
                    <div className="font-semibold text-green-800">
                      {formatMeasurement(shelf.distanceFromFloor, unit)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.verticalSpacing && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Vertical Spacing</h4>
              <div className="text-sm">
                <span className="text-gray-600">Distance between shelves:</span>
                <div className="font-semibold text-blue-800">
                  {formatMeasurement(result.verticalSpacing, unit)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Installation Steps */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Installation Instructions</h3>
          <div className="space-y-3">
            {result.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-700 text-sm">{instruction}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pro Tips
            </h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Double-check all measurements before drilling</li>
              <li>• Use a level to ensure shelves are perfectly horizontal</li>
              <li>• Mark lightly with pencil first, then darker when confirmed</li>
              <li>• Consider the weight of items you'll place on shelves</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step-by-step marking guide */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Mark Your Wall</h3>
        <div className="space-y-4">
          {result.shelves.map((shelf, index) => (
            <div key={shelf.id} className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Shelf {index + 1} Marking</h4>
              <p className="text-sm text-gray-700">
                <strong>Step 1:</strong> Starting from the left corner of your wall, measure{' '}
                <span className="font-semibold text-blue-600">
                  {formatMeasurement(shelf.distanceFromLeft, unit)}
                </span>{' '}
                horizontally and mark this point.
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Step 2:</strong> From the floor, measure{' '}
                <span className="font-semibold text-green-600">
                  {formatMeasurement(shelf.distanceFromFloor, unit)}
                </span>{' '}
                vertically at the marked horizontal position.
              </p>
              <p className="text-sm text-gray-700 mt-2">
                <strong>Step 3:</strong> This intersection point is the <strong>bottom-left corner</strong> of your shelf.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
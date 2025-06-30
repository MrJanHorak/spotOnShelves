import React from 'react';
import { Wrench, Shield, AlertTriangle } from 'lucide-react';
import { ProjectSettings } from '../types';

interface ToolsAndGuidanceProps {
  settings: ProjectSettings;
}

export function ToolsAndGuidance({ settings }: ToolsAndGuidanceProps) {
  const getToolsForWallMaterial = (material: string) => {
    const baseTools = ['Tape measure', 'Level', 'Pencil', 'Drill'];
    
    switch (material) {
      case 'drywall':
        return [...baseTools, 'Stud finder', 'Drywall anchors', 'Screws (2-3 inches)'];
      case 'plaster':
        return [...baseTools, 'Stud finder', 'Toggle bolts', 'Masonry bit'];
      case 'concrete':
        return [...baseTools, 'Hammer drill', 'Masonry bits', 'Concrete anchors', 'Safety glasses'];
      case 'brick':
        return [...baseTools, 'Hammer drill', 'Masonry bits', 'Brick anchors', 'Safety glasses', 'Dust mask'];
      default:
        return baseTools;
    }
  };

  const getMountingAdvice = (mountingType: string, wallMaterial: string) => {
    const advice = {
      floating: {
        drywall: 'Use heavy-duty drywall anchors or locate studs for secure mounting. Floating shelves need strong support.',
        plaster: 'Use toggle bolts or molly bolts. Plaster can crack, so pre-drill carefully.',
        concrete: 'Use concrete anchors and a hammer drill. Mark positions carefully as concrete is unforgiving.',
        brick: 'Drill into brick, not mortar. Use appropriate masonry anchors.'
      },
      bracketed: {
        drywall: 'Mount brackets into studs when possible. Use appropriate wall anchors for hollow areas.',
        plaster: 'Use toggle bolts for secure mounting. Test the wall thickness first.',
        concrete: 'Use hammer drill and concrete anchors. Ensure brackets are level.',
        brick: 'Drill pilot holes in brick, not mortar joints. Use masonry anchors.'
      },
      'l-bracket': {
        drywall: 'L-brackets distribute weight well. Mount at least one screw into a stud.',
        plaster: 'Use multiple attachment points with appropriate anchors.',
        concrete: 'Pre-drill holes and use concrete anchors rated for the shelf weight.',
        brick: 'Choose solid brick areas for mounting. Avoid mortar joints when possible.'
      }
    };

    return advice[mountingType as keyof typeof advice]?.[wallMaterial as keyof any] || 
           'Follow manufacturer instructions for your specific shelf and wall type.';
  };

  const getSafetyTips = (wallMaterial: string) => {
    const tips = [
      'Always wear safety glasses when drilling',
      'Check for electrical wires and plumbing behind walls',
      'Use appropriate personal protective equipment'
    ];

    if (wallMaterial === 'concrete' || wallMaterial === 'brick') {
      tips.push('Wear a dust mask when drilling masonry');
      tips.push('Use a hammer drill with appropriate bits');
    }

    tips.push('Ensure shelf weight capacity matches your intended use');
    tips.push('Test mounting security before loading shelves');

    return tips;
  };

  return (
    <div className="space-y-6">
      {/* Tools Required */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-blue-600" />
          Required Tools
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {getToolsForWallMaterial(settings.wallMaterial).map((tool, index) => (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <span className="text-sm font-medium text-blue-900">{tool}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mounting Guidance */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mounting Guidance</h2>
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">
              {settings.mountingType.charAt(0).toUpperCase() + settings.mountingType.slice(1).replace('-', ' ')} 
              {' '}on {settings.wallMaterial.charAt(0).toUpperCase() + settings.wallMaterial.slice(1)}
            </h3>
            <p className="text-green-800 text-sm">
              {getMountingAdvice(settings.mountingType, settings.wallMaterial)}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Stud Finding Guide</h3>
            <div className="space-y-2 text-blue-800 text-sm">
              <p><strong>Step 1:</strong> Turn on your stud finder and calibrate it according to the manufacturer's instructions.</p>
              <p><strong>Step 2:</strong> Starting from the left side of your planned shelf area, slowly slide the stud finder horizontally.</p>
              <p><strong>Step 3:</strong> Mark the edges of each stud found. Studs are typically 16" or 24" apart.</p>
              <p><strong>Step 4:</strong> Verify stud locations by tapping the wall - hollow sounds indicate space between studs.</p>
              <p><strong>Step 5:</strong> Plan your shelf mounting to hit at least one stud per shelf if possible.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          Safety Guidelines
        </h2>
        <div className="space-y-3">
          {getSafetyTips(settings.wallMaterial).map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Capacity Guide */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Weight Capacity Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">Light Duty (5-15 lbs)</h3>
            <p className="text-amber-800 text-sm mb-2">Books, small decorations, lightweight items</p>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Standard drywall anchors sufficient</li>
              <li>• Basic L-brackets work well</li>
              <li>• 1-2 mounting points needed</li>
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2">Medium Duty (15-40 lbs)</h3>
            <p className="text-orange-800 text-sm mb-2">Heavy books, kitchen items, electronics</p>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• Heavy-duty anchors or stud mounting</li>
              <li>• Multiple mounting points</li>
              <li>• Consider bracket style shelving</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Heavy Duty (40+ lbs)</h3>
            <p className="text-red-800 text-sm mb-2">Large books, storage bins, heavy equipment</p>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Must mount into studs</li>
              <li>• Professional installation recommended</li>
              <li>• Use heavy-duty brackets only</li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Testing Your Installation</h3>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Gradually add weight after installation</li>
              <li>• Check for sagging or movement</li>
              <li>• Inspect mounting points regularly</li>
              <li>• Never exceed manufacturer specifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
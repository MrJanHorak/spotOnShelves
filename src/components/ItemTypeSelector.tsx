import { Package, Image, FileText, Circle, Tv, Palette } from 'lucide-react';
import { ItemType } from '../types';

interface ItemTypeSelectorProps {
  selectedType: ItemType;
  onTypeChange: (type: ItemType) => void;
}

export function ItemTypeSelector({
  selectedType,
  onTypeChange,
}: ItemTypeSelectorProps) {
  const itemTypes: Array<{
    type: ItemType;
    label: string;
    icon: typeof Package;
  }> = [
    { type: 'shelf', label: 'Shelf', icon: Package },
    { type: 'picture', label: 'Picture Frame', icon: Image },
    { type: 'poster', label: 'Poster', icon: FileText },
    { type: 'mirror', label: 'Mirror', icon: Circle },
    { type: 'tv', label: 'TV', icon: Tv },
    { type: 'artpiece', label: 'Art Piece', icon: Palette },
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
      {itemTypes.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
            selectedType === type
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <Icon
            className={`h-6 w-6 ${
              selectedType === type ? 'text-blue-600' : 'text-gray-600'
            }`}
          />
          <span
            className={`text-sm font-medium ${
              selectedType === type ? 'text-blue-900' : 'text-gray-700'
            }`}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

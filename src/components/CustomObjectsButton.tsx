import React from 'react';
import { Package, Database, Box } from 'lucide-react';

interface CustomObjectsButtonProps {
  onClick: () => void;
  objectCount?: number;
}

export const CustomObjectsButton: React.FC<CustomObjectsButtonProps> = ({
  onClick,
  objectCount = 0
}) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-2 rounded-lg transition-all hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl flex items-center gap-2"
      title="Manage Custom Objects"
    >
      <div className="relative">
        <Box className="w-5 h-5" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-indigo-700 flex items-center justify-center text-[8px] font-bold">
          {objectCount}
        </div>
      </div>
      <span className="text-sm font-medium">Objects</span>
    </button>
  );
};
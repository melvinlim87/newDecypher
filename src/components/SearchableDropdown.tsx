import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  searchable?: boolean;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  label,
  searchable = false
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm || !searchable) return options;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return options.filter(
      option => option.label.toLowerCase().includes(lowerSearchTerm) || 
                option.value.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, options, searchable]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || value;

  return (
    <div className="relative">
      <label className="block text-white mb-2">{label}</label>
      <div className="relative">
        <div 
          className="w-full px-4 py-2 rounded-lg glass-effect gradient-border bg-transparent text-white cursor-pointer flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedLabel}</span>
          <Search className="w-4 h-4" />
        </div>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-indigo-500 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {searchable && (
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-transparent text-white border-b border-indigo-500 focus:outline-none"
                placeholder="Search..."
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="py-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 hover:bg-indigo-500/20 cursor-pointer text-white"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

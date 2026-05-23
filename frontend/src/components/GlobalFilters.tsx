import React from 'react';
import { Calendar, Globe, DollarSign, X } from 'lucide-react';

interface GlobalFiltersProps {
  filters: {
    dateRange: string;
    country: string;
    minPrice: number;
    maxPrice: number;
  };
  onFilterChange: (filters: any) => void;
}

const GlobalFilters: React.FC<GlobalFiltersProps> = ({ filters, onFilterChange }) => {
  const handleChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      dateRange: 'all',
      country: '',
      minPrice: 0,
      maxPrice: 0,
    });
  };

  const hasFilters = filters.dateRange !== 'all' || filters.country !== '' || filters.minPrice > 0 || filters.maxPrice > 0;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center gap-4 z-20 shadow-sm transition-all">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <Calendar size={14} className="text-indigo-500" />
        <select 
          value={filters.dateRange}
          onChange={(e) => handleChange('dateRange', e.target.value)}
          className="text-xs font-semibold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-indigo-300 transition-all">
        <Globe size={14} className="text-indigo-500" />
        <select 
          value={filters.country}
          onChange={(e) => handleChange('country', e.target.value)}
          className="text-xs font-semibold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
        >
          <option value="">All Countries</option>
          <option value="USA">USA</option>
          <option value="Canada">Canada</option>
          <option value="UK">UK</option>
          <option value="Germany">Germany</option>
          <option value="India">India</option>
        </select>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-indigo-300 transition-all">
        <DollarSign size={14} className="text-indigo-500" />
        <input 
          type="number" 
          placeholder="Min Price"
          value={filters.minPrice || ''}
          onChange={(e) => handleChange('minPrice', parseFloat(e.target.value) || 0)}
          className="w-20 text-xs font-semibold text-gray-900 bg-transparent border-none focus:ring-0 outline-none"
        />
        <span className="text-gray-300">-</span>
        <input 
          type="number" 
          placeholder="Max"
          value={filters.maxPrice || ''}
          onChange={(e) => handleChange('maxPrice', parseFloat(e.target.value) || 0)}
          className="w-20 text-xs font-semibold text-gray-900 bg-transparent border-none focus:ring-0 outline-none"
        />
      </div>

      {hasFilters && (
        <button 
          onClick={clearFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
        >
          <X size={12} />
          CLEAR FILTERS
        </button>
      )}
    </div>
  );
};

export default GlobalFilters;

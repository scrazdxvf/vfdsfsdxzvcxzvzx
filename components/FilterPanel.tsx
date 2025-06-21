
import React, { useState } from 'react';
import { FilterState, ProductCondition } from '../types';
import { CATEGORIES, UKRAINIAN_CITIES, PRODUCT_CONDITIONS_OPTIONS } from '../constants';
import { ChevronDownIcon, ChevronUpIcon, AdjustmentsIcon, XCircleIcon } from './icons/HeroIcons';

interface FilterPanelProps {
  initialFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ initialFilters, onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: name === 'priceMin' || name === 'priceMax' ? (value === '' ? null : Number(value)) : value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
    // setIsExpanded(false); // Optionally collapse after applying
  };

  const handleResetFilters = () => {
    const resetState = { 
        searchTerm: filters.searchTerm, // Keep search term
        priceMin: null, priceMax: null, city: '', condition: '' as ProductCondition | '', category: '' 
    };
    setFilters(resetState);
    onFilterChange(resetState);
  };

  return (
    <div className="bg-lightCard dark:bg-darkCard p-4 rounded-lg shadow-md mb-6 transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-lg font-semibold text-lightText dark:text-darkText mb-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div className="flex items-center">
          <AdjustmentsIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light" />
          Фильтры
        </div>
        {isExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
      </button>
      
      {/* Search Term Input (always visible or part of header search) */}
      {/* This example assumes search term is handled outside or in a dedicated search bar */}

      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ maxHeight: isExpanded ? '1000px' : '0px' }} // Ensure max-height is enough
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div>
            <label htmlFor="priceMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена от (грн)</label>
            <input
              type="number"
              name="priceMin"
              id="priceMin"
              value={filters.priceMin ?? ''}
              onChange={handleChange}
              placeholder="0"
              className="w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="priceMax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена до (грн)</label>
            <input
              type="number"
              name="priceMax"
              id="priceMax"
              value={filters.priceMax ?? ''}
              onChange={handleChange}
              placeholder="100000"
              className="w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Город</label>
            <select
              name="city"
              id="city"
              value={filters.city}
              onChange={handleChange}
              className="w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary"
            >
              <option value="">Все города</option>
              {UKRAINIAN_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Состояние</label>
            <select
              name="condition"
              id="condition"
              value={filters.condition}
              onChange={handleChange}
              className="w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary"
            >
              <option value="">Любое</option>
              {PRODUCT_CONDITIONS_OPTIONS.map(cond => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория</label>
            <select
              name="category"
              id="category"
              value={filters.category}
              onChange={handleChange}
              className="w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary"
            >
              <option value="">Все категории</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center"
          >
            <XCircleIcon className="w-5 h-5 mr-1" />
            Сбросить
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-6 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light transition-colors flex items-center"
          >
            <AdjustmentsIcon className="w-5 h-5 mr-1 transform rotate-90" />
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
    
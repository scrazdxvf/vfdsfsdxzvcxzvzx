
import React, { useState, useMemo, useCallback } from 'react';
import ListingCard from '../components/ListingCard';
import FilterPanel from '../components/FilterPanel';
import { Listing, FilterState } from '../types';
import { useListings } from '../contexts/ListingContext';
import { DEFAULT_FILTERS } from '../constants';
import { SearchIcon } from '../components/icons/HeroIcons';

const HomePage: React.FC = () => {
  const { listings: allListings, loadingListings } = useListings();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(prev => ({...prev, ...newFilters}));
  },[]);

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const filteredListings = useMemo(() => {
    return allListings
    .filter(listing => listing.status === 'active') // Only show active listings
    .filter(listing => {
      const searchTermMatch = filters.searchTerm === '' || 
        listing.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const priceMinMatch = filters.priceMin === null || listing.price >= filters.priceMin;
      const priceMaxMatch = filters.priceMax === null || listing.price <= filters.priceMax;
      const cityMatch = filters.city === '' || listing.city === filters.city;
      const conditionMatch = filters.condition === '' || listing.condition === filters.condition;
      const categoryMatch = filters.category === '' || listing.category.id === filters.category;

      return searchTermMatch && priceMinMatch && priceMaxMatch && cityMatch && conditionMatch && categoryMatch;
    });
  }, [allListings, filters]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-primary dark:text-primary-light">
        Добро пожаловать на СКР БАРАХОЛКУ!
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        Находите лучшие предложения или продавайте свои вещи легко и быстро.
      </p>

      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Искать товары..."
            value={filters.searchTerm}
            onChange={handleSearchTermChange}
            className="w-full p-3 pl-10 border border-lightBorder dark:border-darkBorder rounded-lg shadow-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
          />
          <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      
      <FilterPanel initialFilters={filters} onFilterChange={handleFilterChange} />

      {loadingListings ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
          <p className="ml-4 text-lg">Загрузка объявлений...</p>
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing: Listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <img src="https://picsum.photos/seed/emptybox/300/200?grayscale" alt="Empty box" className="mx-auto mb-4 rounded-lg opacity-70" />
          <h2 className="text-2xl font-semibold mb-2">Упс, ничего не найдено!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Попробуйте изменить фильтры или поисковый запрос.
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
    
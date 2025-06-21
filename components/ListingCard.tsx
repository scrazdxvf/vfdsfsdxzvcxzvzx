
import React from 'react';
import { Link } from 'react-router-dom';
import { Listing } from '../types';
import { LocationMarkerIcon, TagIcon, CurrencyDollarIcon, InformationCircleIcon } from './icons/HeroIcons'; // Assuming you have HeroIcons

interface ListingCardProps {
  listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  return (
    <Link 
      to={`/listing/${listing.id}`} 
      className="block bg-lightCard dark:bg-darkCard rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in"
    >
      <div className="relative h-48 sm:h-56 w-full">
        <img 
          src={listing.images[0] || 'https://picsum.photos/600/400?grayscale'} 
          alt={listing.title} 
          className="w-full h-full object-cover" 
        />
        {listing.status === 'pending_moderation' && (
           <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">На модерации</span>
        )}
        {listing.status === 'sold' && (
           <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">Продано</span>
        )}
         {listing.status === 'rejected' && (
           <span className="absolute top-2 left-2 bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">Отклонено</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-lightText dark:text-darkText mb-1 truncate" title={listing.title}>
          {listing.title}
        </h3>
        <div className="flex items-center text-primary dark:text-primary-light font-bold text-xl mb-2">
           <CurrencyDollarIcon className="w-5 h-5 mr-1" />
           {listing.price.toLocaleString('uk-UA')} грн
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex items-center">
            <TagIcon className="w-4 h-4 mr-2 flex-shrink-0 text-accent dark:text-accent-light" />
            <span className="truncate" title={`${listing.category.name} / ${listing.subcategory.name}`}>
              {listing.category.name} / {listing.subcategory.name}
            </span>
          </div>
          <div className="flex items-center">
            <LocationMarkerIcon className="w-4 h-4 mr-2 flex-shrink-0 text-accent dark:text-accent-light" />
            <span className="truncate" title={listing.city}>{listing.city}</span>
          </div>
          <div className="flex items-center">
             <InformationCircleIcon className="w-4 h-4 mr-2 flex-shrink-0 text-accent dark:text-accent-light" />
             <span className="truncate" title={listing.condition}>{listing.condition}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
    
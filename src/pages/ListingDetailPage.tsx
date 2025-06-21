import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing } from '../types';
import { useListings } from '../contexts/ListingContext';
import { useAuth } from '../contexts/AuthContext';
import { LocationMarkerIcon, TagIcon, CurrencyDollarIcon, InformationCircleIcon, ChevronLeftIcon, ChevronRightIcon, UserCircleIcon, PencilIcon, TrashIcon } from '../components/icons/HeroIcons';
import Modal from '../components/Modal';
import { Timestamp } from 'firebase/firestore';


const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getListingById, loadingListings: contextLoading, deleteListing } = useListings();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchListingDetails = useCallback(async () => {
    if (id) {
        setPageLoading(true);
        const foundListing = await getListingById(id);
        if (foundListing) {
            setListing(foundListing);
        } else {
            navigate('/', { replace: true, state: { error: "Объявление не найдено." } });
        }
        setPageLoading(false);
    }
  }, [id, getListingById, navigate]);

  useEffect(() => {
    fetchListingDetails();
  }, [fetchListingDetails]);

  const nextImage = () => {
    if (listing && listing.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing && listing.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + listing.images.length) % listing.images.length);
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirmed = async () => {
    if (listing && user && (listing.sellerId === user.id || user.isAdmin)) {
      try {
        await deleteListing(listing.id);
        closeDeleteDialog();
        navigate(user.isAdmin && listing.sellerId !== user.id ? '/admin' : '/profile'); // Redirect based on role
      } catch (error) {
        console.error("Failed to delete listing:", error);
        // show error to user
        closeDeleteDialog();
      }
    }
  };
  
  const handleEditListing = () => {
    if (listing && user && (listing.sellerId === user.id || user.isAdmin)) {
      navigate('/post-ad', { state: { listingId: listing.id } });
    }
  };

  if (pageLoading || contextLoading && !listing) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
        <p className="ml-4 text-lg">Загрузка объявления...</p>
      </div>
    );
  }

  if (!listing) {
     return (
      <div className="text-center p-8 text-lg text-red-500">
        Объявление не найдено или было удалено.
        <button onClick={() => navigate('/')} className="block mx-auto mt-4 px-4 py-2 bg-primary text-white rounded-md">На главную</button>
      </div>
    );
  }
  
  const isOwner = user && listing.sellerId === user.id;
  const canModify = isOwner || (user?.isAdmin || false);
  const createdAtDate = listing.createdAt instanceof Timestamp ? listing.createdAt.toDate() : new Date(listing.createdAt);


  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center text-primary dark:text-primary-light hover:underline"
      >
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Назад
      </button>

      <div className="bg-lightCard dark:bg-darkCard shadow-xl rounded-lg overflow-hidden">
        {/* Image Gallery */}
        <div className="relative w-full h-72 sm:h-96 md:h-[500px] bg-gray-200 dark:bg-gray-700">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[currentImageIndex]}
              alt={`${listing.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">Нет изображений</div>
          )}
          {listing.images && listing.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                {listing.images.map((_, index) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-gray-400 opacity-70'} hover:opacity-100 transition-all`}
                        aria-label={`Go to image ${index + 1}`}
                    />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Listing Info */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-lightText dark:text-darkText mb-2 md:mb-0">
              {listing.title}
            </h1>
            {canModify && (
                <div className="flex space-x-2 mt-2 md:mt-0 self-start md:self-center">
                    <button onClick={handleEditListing} className="flex items-center px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors">
                        <PencilIcon className="w-4 h-4 mr-1" /> Редакт.
                    </button>
                    <button onClick={openDeleteDialog} className="flex items-center px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                        <TrashIcon className="w-4 h-4 mr-1" /> Удалить
                    </button>
                </div>
            )}
          </div>
          
          <div className="flex items-center text-primary dark:text-primary-light font-bold text-3xl mb-6">
            <CurrencyDollarIcon className="w-8 h-8 mr-2" />
            {listing.price.toLocaleString('uk-UA')} грн
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center">
              <TagIcon className="w-5 h-5 mr-3 text-accent dark:text-accent-light flex-shrink-0" />
              <span>Категория: {listing.category.name} / {listing.subcategory.name}</span>
            </div>
            <div className="flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-3 text-accent dark:text-accent-light flex-shrink-0" />
              <span>Состояние: {listing.condition}</span>
            </div>
            <div className="flex items-center">
              <LocationMarkerIcon className="w-5 h-5 mr-3 text-accent dark:text-accent-light flex-shrink-0" />
              <span>Город: {listing.city}</span>
            </div>
             <div className="flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-3 text-accent dark:text-accent-light flex-shrink-0" />
              <span>Продавец: {listing.sellerUsername || 'Аноним'}</span>
            </div>
            <div className="flex items-center sm:col-span-2">
                <InformationCircleIcon className="w-5 h-5 mr-3 text-accent dark:text-accent-light flex-shrink-0" />
                <span>Опубликовано: {createdAtDate.toLocaleDateString('uk-UA')} в {createdAtDate.toLocaleTimeString('uk-UA')}</span>
            </div>
          </div>
          
          {listing.status === 'pending_moderation' && (
           <p className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-700 text-yellow-700 dark:text-yellow-200 rounded-md text-sm">Это объявление ожидает модерации.</p>
          )}
          {listing.status === 'rejected' && (
            <p className="mb-4 p-3 bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-200 rounded-md text-sm">Это объявление было отклонено модератором.</p>
          )}
           {listing.status === 'sold' && (
            <p className="mb-4 p-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md text-sm">Этот товар уже продан.</p>
          )}


          <h2 className="text-xl font-semibold text-lightText dark:text-darkText mb-3 mt-8">Описание</h2>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
            {listing.description}
          </p>

          <div className="mt-8 pt-6 border-t border-lightBorder dark:border-darkBorder">
            <h2 className="text-xl font-semibold text-lightText dark:text-darkText mb-3">Связаться с продавцом</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Контакт: <strong className="text-primary dark:text-primary-light">{listing.sellerContact}</strong>
            </p>
            {/* Add a button to message seller if implementing chat */}
          </div>
        </div>
      </div>
       <Modal isOpen={isDeleteDialogOpen} onClose={closeDeleteDialog} title="Подтвердить удаление">
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Вы уверены, что хотите удалить объявление "{listing?.title}"? Это действие необратимо.
        </p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={closeDeleteDialog} 
            className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            Отмена
          </button>
          <button 
            onClick={handleDeleteConfirmed} 
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
            Удалить
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ListingDetailPage;

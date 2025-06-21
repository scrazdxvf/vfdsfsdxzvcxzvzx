import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useListings } from '../contexts/ListingContext';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import { UserCircleIcon, PencilIcon, TrashIcon, EyeIcon } from '../components/icons/HeroIcons';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';

const UserProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { getUserListings, loadingListings: listingsLoadingContext, deleteListing } = useListings();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const navigate = useNavigate();

  const fetchMyListings = useCallback(async () => {
    if (user) {
      setPageLoading(true);
      const fetchedListings = await getUserListings(user.id);
      setMyListings(fetchedListings);
      setPageLoading(false);
    } else {
      setMyListings([]);
      setPageLoading(false);
    }
  }, [user, getUserListings]);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const openDeleteDialog = (listing: Listing) => {
    setListingToDelete(listing);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setListingToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirmed = async () => {
    if (listingToDelete && user) {
        try {
            await deleteListing(listingToDelete.id);
            fetchMyListings(); // Re-fetch to update the list
        } catch (error) {
            console.error("Failed to delete listing:", error);
            // Optionally show an error message to the user
        } finally {
            closeDeleteDialog();
        }
    }
  };
  
  const handleEditListing = (listingId: string) => {
    navigate('/post-ad', { state: { listingId } });
  };


  if (authLoading || pageLoading || (listingsLoadingContext && myListings.length === 0)) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
          <p className="ml-4 text-lg">Загрузка профиля...</p>
        </div>
      );
  }

  if (!user) {
    return <div className="text-center p-8 text-lg text-red-500">Пользователь не найден. Пожалуйста, войдите.</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="bg-lightCard dark:bg-darkCard shadow-xl rounded-lg p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center">
          <UserCircleIcon className="w-24 h-24 md:w-32 md:h-32 text-primary dark:text-primary-light mb-4 sm:mb-0 sm:mr-6" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-lightText dark:text-darkText">{user.username || user.email}</h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            {user.city && <p className="text-gray-600 dark:text-gray-400">Город: {user.city}</p>}
            {user.telegram && <p className="text-gray-600 dark:text-gray-400">Telegram: {user.telegram}</p>}
            {user.isAdmin && <span className="mt-2 inline-block bg-accent text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Администратор</span>}
          </div>
        </div>
        {/* Placeholder for edit profile button
        <div className="mt-6 text-right">
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">Редактировать профиль</button>
        </div>
        */}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6 text-lightText dark:text-darkText">Мои объявления ({myListings.length})</h2>
        {myListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map(listing => (
              <div key={listing.id} className="relative group">
                <ListingCard listing={listing} />
                <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button 
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    className="p-1.5 bg-primary/80 hover:bg-primary text-white rounded-full shadow-md backdrop-blur-sm" 
                    title="Просмотреть">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                   <button 
                    onClick={() => handleEditListing(listing.id)}
                    className="p-1.5 bg-yellow-500/80 hover:bg-yellow-500 text-white rounded-full shadow-md backdrop-blur-sm" 
                    title="Редактировать">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteDialog(listing)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-md backdrop-blur-sm" 
                    title="Удалить">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-lightCard dark:bg-darkCard rounded-lg shadow">
            <img src="https://picsum.photos/seed/emptyfolder/200/150?grayscale" alt="Empty folder" className="mx-auto mb-4 rounded-lg opacity-60" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">У вас пока нет объявлений.</p>
            <button 
              onClick={() => navigate('/post-ad')}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Создать объявление
            </button>
          </div>
        )}
      </div>
      
      <Modal isOpen={isDeleteDialogOpen} onClose={closeDeleteDialog} title="Подтвердить удаление">
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Вы уверены, что хотите удалить объявление "{listingToDelete?.title}"? Это действие необратимо, включая удаление всех изображений товара.
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

export default UserProfilePage;

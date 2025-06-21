import React, { useState, useEffect, useCallback } from 'react';
import { useListings } from '../contexts/ListingContext';
import { Listing } from '../types';
import { CheckCircleIcon, BanIcon, EyeIcon, TrashIcon } from '../components/icons/HeroIcons';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { collection, getDocs, query, where, limit,getCountFromServer } from 'firebase/firestore'; // For user stats
import { db } from '../firebase'; // For user stats

const AdminDashboardPage: React.FC = () => {
  const { listings, loadingListings, updateListingStatus, deleteListing, fetchListings: refreshAllListings } = useListings();
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0); 
  const [newUsersLast24h, setNewUsersLast24h] = useState(0); 
  const [currentOnlineUsers, setCurrentOnlineUsers] = useState(0); // This remains mocked as it's complex
  const navigate = useNavigate();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');


  const loadDashboardData = useCallback(async () => {
    if (!loadingListings) { // Use context's loadingListings
      setPendingListings(listings.filter(l => l.status === 'pending_moderation'));
      setActiveListingsCount(listings.filter(l => l.status === 'active').length);
    }
    // Fetch user stats from Firestore
    try {
        const usersCollection = collection(db, "users");
        // Total users
        const totalUsersSnapshot = await getCountFromServer(usersCollection);
        setTotalUsersCount(totalUsersSnapshot.data().count);

        // New users in last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newUsersQuery = query(usersCollection, where("createdAt", ">=", yesterday));
        const newUsersSnapshot = await getCountFromServer(newUsersQuery);
        setNewUsersLast24h(newUsersSnapshot.data().count);

    } catch (error) {
        console.error("Error fetching user stats:", error);
    }

    // Mocked online users
    setCurrentOnlineUsers(Math.floor(Math.random() * 50) + 10);
  }, [listings, loadingListings]);
  
  useEffect(() => {
    refreshAllListings(); // Initial fetch or refresh when component mounts
  }, [refreshAllListings]);

  useEffect(() => {
    loadDashboardData(); // Process listings when they change or component loads
    const interval = setInterval(() => {
        setCurrentOnlineUsers(Math.floor(Math.random() * 50) + 20);
    }, 15000); // Update mock online users periodically
    return () => clearInterval(interval);
  }, [loadDashboardData]); // loadDashboardData depends on listings from context

  const handleActionConfirm = async () => {
    if (confirmAction) {
      await confirmAction();
    }
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
     // Data re-fetch/re-filter is handled by `loadDashboardData` via `listings` dependency
     // or explicitly by `refreshAllListings` if needed after an action.
     // For status updates, local state of listings in context is updated, triggering re-render.
     // For delete, context also updates its local state.
     // A full refresh might be good to ensure consistency:
    await refreshAllListings(); 
    loadDashboardData(); // Re-process after refresh
  };

  const openConfirmationModal = (action: () => Promise<void>, title: string, message: string) => {
    setConfirmAction(() => action); // Wrap in a function to avoid immediate call
    setConfirmTitle(title);
    setConfirmMessage(message);
    setIsConfirmModalOpen(true);
  };


  const handleApprove = (listingId: string) => {
    openConfirmationModal(
        async () => updateListingStatus(listingId, 'active'),
        'Подтвердить одобрение',
        'Вы уверены, что хотите одобрить это объявление?'
    );
  };

  const handleReject = (listingId: string) => {
    openConfirmationModal(
        async () => updateListingStatus(listingId, 'rejected'),
        'Подтвердить отклонение',
        'Вы уверены, что хотите отклонить это объявление?'
    );
  };
  
  const handleDelete = (listingId: string, listingImages?: string[]) => { // listingImages for context's delete
     openConfirmationModal(
        async () => deleteListing(listingId), // Pass image URLs if context needs them
        'Подтвердить удаление',
        'Вы уверены, что хотите удалить это объявление навсегда? Это действие необратимо.'
    );
  };

  const StatCard: React.FC<{title: string; value: string | number; colorClass: string}> = ({title, value, colorClass}) => (
    <div className={`bg-lightCard dark:bg-darkCard p-6 rounded-xl shadow-lg border-l-4 ${colorClass} transform hover:scale-105 transition-transform duration-200`}>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-lightText dark:text-darkText">{value}</p>
    </div>
  );

  if (loadingListings && listings.length === 0) { // Show loader if initial load of all listings is in progress
     return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
          <p className="ml-4 text-lg">Загрузка панели администратора...</p>
        </div>
      );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8 text-primary dark:text-primary-light">Панель Администратора</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Пользователей онлайн" value={currentOnlineUsers} colorClass="border-green-500" />
        <StatCard title="Новых за 24ч" value={newUsersLast24h} colorClass="border-blue-500" />
        <StatCard title="Всего пользователей" value={totalUsersCount} colorClass="border-purple-500" />
        <StatCard title="Активных объявлений" value={activeListingsCount} colorClass="border-yellow-500" />
      </div>

      <h2 className="text-2xl font-semibold mb-6 text-lightText dark:text-darkText">Объявления на модерации ({pendingListings.length})</h2>
      {pendingListings.length > 0 ? (
        <div className="bg-lightCard dark:bg-darkCard shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-lightBorder dark:divide-darkBorder">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Товар</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Цена</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Продавец</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Дата</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-lightBg dark:bg-darkBg divide-y divide-lightBorder dark:divide-darkBorder">
              {pendingListings.map(listing => (
                <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-md object-cover" src={listing.images[0]} alt={listing.title} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-lightText dark:text-darkText truncate max-w-xs" title={listing.title}>{listing.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{listing.category.name} / {listing.subcategory.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-lightText dark:text-darkText">{listing.price} грн</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{listing.sellerUsername || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {listing.createdAt instanceof Date ? listing.createdAt.toLocaleDateString() : 
                     listing.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                    <button onClick={() => navigate(`/listing/${listing.id}`)} className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-full hover:bg-blue-100 dark:hover:bg-blue-900" title="Просмотреть">
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleApprove(listing.id)} className="p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors rounded-full hover:bg-green-100 dark:hover:bg-green-900" title="Одобрить">
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleReject(listing.id)} className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full hover:bg-red-100 dark:hover:bg-red-900" title="Отклонить">
                      <BanIcon className="w-5 h-5" />
                    </button>
                     <button onClick={() => handleDelete(listing.id, listing.images)} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" title="Удалить">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 bg-lightCard dark:bg-darkCard rounded-lg shadow">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Нет объявлений, ожидающих модерации. Отличная работа!</p>
        </div>
      )}
      
       <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)} 
        title={confirmTitle}
      >
        <p className="text-gray-700 dark:text-gray-300 mb-6">{confirmMessage}</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={() => setIsConfirmModalOpen(false)} 
            className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            Отмена
          </button>
          <button 
            onClick={handleActionConfirm} 
            className={`px-4 py-2 rounded-md text-white transition-colors ${confirmTitle.toLowerCase().includes('удалить') || confirmTitle.toLowerCase().includes('отклонить') ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            Подтвердить
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default AdminDashboardPage;

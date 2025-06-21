import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Listing, ProductCondition, Category, SubCategory } from '../types';
import { CATEGORIES, UKRAINIAN_CITIES, PRODUCT_CONDITIONS_OPTIONS } from '../constants';
import { useListings } from '../contexts/ListingContext';
import { useAuth } from '../contexts/AuthContext';
import { PhotographIcon, PlusCircleIcon, XIcon as CloseIcon } from '../components/icons/HeroIcons'; // Renamed XIcon to avoid conflict
import { Timestamp } from 'firebase/firestore';


interface FormState {
  title: string;
  description: string;
  price: string;
  condition: ProductCondition | '';
  categoryId: string;
  subcategoryId: string;
  city: string;
  sellerContact: string;
  // For editing:
  existingImageUrls: string[]; // URLs of images already in storage
  newImageFiles: File[]; // New files to be uploaded
}

const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addListing, updateListing, getListingById: fetchListingById, loadingListings } = useListings();
  const { user } = useAuth();

  const editingListingId = (location.state as { listingId?: string })?.listingId;
  const [isEditing, setIsEditing] = useState<boolean>(!!editingListingId);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);

  const [formState, setFormState] = useState<FormState>({
    title: '',
    description: '',
    price: '',
    condition: '',
    categoryId: '',
    subcategoryId: '',
    city: user?.city || UKRAINIAN_CITIES[0],
    sellerContact: user?.telegram || '',
    existingImageUrls: [],
    newImageFiles: [],
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Combines existing and new previews
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListingForEdit = async () => {
      if (editingListingId && user) {
        setIsLoading(true);
        const fetchedListing = await fetchListingById(editingListingId);
        if (fetchedListing && fetchedListing.sellerId === user.id) {
          setListingToEdit(fetchedListing);
          setFormState({
            title: fetchedListing.title,
            description: fetchedListing.description,
            price: fetchedListing.price.toString(),
            condition: fetchedListing.condition,
            categoryId: fetchedListing.category.id,
            subcategoryId: fetchedListing.subcategory.id,
            city: fetchedListing.city,
            sellerContact: fetchedListing.sellerContact,
            existingImageUrls: fetchedListing.images || [],
            newImageFiles: [],
          });
          const cat = CATEGORIES.find(c => c.id === fetchedListing.category.id);
          setSelectedCategory(cat || null);
          setImagePreviews(fetchedListing.images || []);
        } else if (!loadingListings) {
          navigate('/profile', { replace: true, state: { error: "Не удалось загрузить объявление для редактирования." } });
        }
        setIsLoading(false);
      }
    };
    loadListingForEdit();
  }, [editingListingId, fetchListingById, user, navigate, loadingListings]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));

    if (name === 'categoryId') {
      const category = CATEGORIES.find(cat => cat.id === value);
      setSelectedCategory(category || null);
      setFormState(prev => ({ ...prev, subcategoryId: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const currentTotalImages = formState.existingImageUrls.length + formState.newImageFiles.length;
      const availableSlots = 5 - currentTotalImages;
      
      if (availableSlots <= 0) {
          setError("Вы можете загрузить максимум 5 изображений.");
          return;
      }

      const newFilesToAdd = filesArray.slice(0, availableSlots);
      
      setFormState(prev => ({ ...prev, newImageFiles: [...prev.newImageFiles, ...newFilesToAdd] }));

      const newImagePreviewUrls = newFilesToAdd.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newImagePreviewUrls]);
      setError(null); // Clear error if files were added
    }
  };
  
  const removeImage = (indexToRemove: number, isExistingUrl: boolean) => {
    const urlToRemove = imagePreviews[indexToRemove];
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));

    if (isExistingUrl) {
      setFormState(prev => ({
        ...prev,
        existingImageUrls: prev.existingImageUrls.filter(url => url !== urlToRemove)
      }));
    } else {
      // It's a newly added file (File object), remove it from newImageFiles
      // This requires finding the corresponding File object if previews are mixed
      // A simpler way: manage previews and files in sync or by object reference
      // For now, we assume the order in imagePreviews matches: existing first, then new.
      const existingCount = formState.existingImageUrls.length;
      if (indexToRemove >= existingCount) {
          const newFileIndex = indexToRemove - existingCount;
           setFormState(prev => ({
            ...prev,
            newImageFiles: prev.newImageFiles.filter((_, idx) => idx !== newFileIndex)
          }));
      } else {
          // This case should be handled by isExistingUrl = true branch
          console.warn("Attempted to remove an existing URL via new file logic.");
      }
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!user) {
      setError("Вы должны быть авторизованы.");
      setIsLoading(false);
      return;
    }
    if (!formState.categoryId || !formState.subcategoryId) {
        setError("Пожалуйста, выберите категорию и подкатегорию.");
        setIsLoading(false);
        return;
    }
    if (imagePreviews.length === 0) {
        setError("Пожалуйста, добавьте хотя бы одно изображение.");
        setIsLoading(false);
        return;
    }

    const category = CATEGORIES.find(c => c.id === formState.categoryId);
    const subcategory = category?.subcategories.find(sc => sc.id === formState.subcategoryId);

    if (!category || !subcategory) {
      setError("Неверная категория или подкатегория.");
      setIsLoading(false);
      return;
    }
    
    try {
      let result: Listing | null = null;
      if (isEditing && listingToEdit) {
        const updateData = {
          title: formState.title,
          description: formState.description,
          price: parseFloat(formState.price) || 0,
          condition: formState.condition as ProductCondition,
          category: category,
          subcategory: subcategory,
          city: formState.city,
          sellerContact: formState.sellerContact,
          existingImageUrls: formState.existingImageUrls,
          newImages: formState.newImageFiles,
        };
        result = await updateListing(listingToEdit.id, updateData);
      } else {
         const listingData = {
          title: formState.title,
          description: formState.description,
          price: parseFloat(formState.price) || 0,
          condition: formState.condition as ProductCondition,
          category: category,
          subcategory: subcategory,
          city: formState.city,
          images: formState.newImageFiles, // addListing expects File[]
          sellerContact: formState.sellerContact,
        };
        result = await addListing(listingData);
      }

      if (result) {
        navigate(`/listing/${result.id}`);
      } else {
        setError("Не удалось сохранить объявление. Попробуйте снова.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при сохранении.");
      console.error("Submit error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if ((isEditing && !listingToEdit && loadingListings) || (isEditing && !listingToEdit && editingListingId && !loadingListings)) {
      return <div className="text-center p-8">Загрузка данных объявления...</div>;
  }
  if (isEditing && !listingToEdit && !loadingListings && editingListingId) {
      return <div className="text-center p-8 text-red-500">Не удалось загрузить объявление для редактирования или у вас нет прав.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-lightCard dark:bg-darkCard rounded-lg shadow-xl animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-primary dark:text-primary-light">
        {isEditing ? "Редактировать объявление" : "Создать новое объявление"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Название товара</label>
          <input type="text" name="title" id="title" value={formState.title} onChange={handleChange} required className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
          <textarea name="description" id="description" value={formState.description} onChange={handleChange} rows={4} required className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary"></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Цена (грн)</label>
            <input type="number" name="price" id="price" value={formState.price} onChange={handleChange} required min="0" step="any" className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Состояние</label>
            <select name="condition" id="condition" value={formState.condition} onChange={handleChange} required className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary">
              <option value="" disabled>Выберите состояние</option>
              {PRODUCT_CONDITIONS_OPTIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Категория</label>
                <select name="categoryId" id="categoryId" value={formState.categoryId} onChange={handleChange} required className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary">
                <option value="" disabled>Выберите категорию</option>
                {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="subcategoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Подкатегория</label>
                <select name="subcategoryId" id="subcategoryId" value={formState.subcategoryId} onChange={handleChange} required disabled={!selectedCategory} className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary disabled:bg-gray-100 dark:disabled:bg-gray-700">
                <option value="" disabled>Выберите подкатегорию</option>
                {selectedCategory?.subcategories.map(subcat => <option key={subcat.id} value={subcat.id}>{subcat.name}</option>)}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Город</label>
                <select name="city" id="city" value={formState.city} onChange={handleChange} required className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary">
                {UKRAINIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="sellerContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Контакт (Telegram username, телефон)</label>
                <input type="text" name="sellerContact" id="sellerContact" value={formState.sellerContact} onChange={handleChange} required className="mt-1 block w-full p-2 border border-lightBorder dark:border-darkBorder rounded-md shadow-sm bg-white dark:bg-gray-800 focus:ring-primary focus:border-primary" />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Изображения (до 5 шт.)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-lightBorder dark:border-darkBorder border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <PhotographIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label htmlFor="images" className={`relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary ${imagePreviews.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span>Загрузите файлы</span>
                  <input id="images" name="images" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageChange} disabled={imagePreviews.length >= 5} />
                </label>
                <p className="pl-1">или перетащите сюда</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF до 10MB. Осталось слотов: {Math.max(0, 5 - imagePreviews.length)}</p>
            </div>
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {imagePreviews.map((previewUrl, index) => {
                 const isExisting = index < formState.existingImageUrls.length && formState.existingImageUrls.includes(previewUrl);
                 return (
                    <div key={previewUrl + index} className="relative group">
                    <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md shadow" />
                    <button 
                        type="button" 
                        onClick={() => removeImage(index, isExisting)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                    >
                        <CloseIcon className="w-3 h-3"/>
                    </button>
                    </div>
                );
            })}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-3 rounded-md">{error}</p>}

        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          {isLoading ? (isEditing ? 'Сохранение...' : 'Публикация...') : (isEditing ? "Сохранить изменения" : "Опубликовать объявление")}
        </button>
      </form>
    </div>
  );
};

export default CreateListingPage;

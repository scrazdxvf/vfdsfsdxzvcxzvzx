import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Listing, ProductCondition, Category, SubCategory } from '../types';
import { CATEGORIES, UKRAINIAN_CITIES, PRODUCT_CONDITIONS_OPTIONS } from '../constants';
import { useListings } from '../contexts/ListingContext';
import { useAuth } from '../contexts/AuthContext';
import { PhotographIcon, PlusCircleIcon, XIcon } from '../components/icons/HeroIcons';

interface FormState {
  title: string;
  description: string;
  price: string; // string for input, convert to number on submit
  condition: ProductCondition | '';
  categoryId: string;
  subcategoryId: string;
  city: string;
  sellerContact: string;
  images: File[];
}

const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addListing, updateListing, getListingById, loadingListings } = useListings();
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
    images: [],
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
    if (editingListingId) {
      setIsLoading(true);
      // Simulate fetching if listings are not yet loaded, or directly get
      const existingListing = getListingById(editingListingId);
      if (existingListing && existingListing.sellerId === user?.id) {
        setListingToEdit(existingListing);
        setFormState({
          title: existingListing.title,
          description: existingListing.description,
          price: existingListing.price.toString(),
          condition: existingListing.condition,
          categoryId: existingListing.category.id,
          subcategoryId: existingListing.subcategory.id,
          city: existingListing.city,
          sellerContact: existingListing.sellerContact,
          images: [], // Images are URLs, handle separately if allowing edit
        });
        const cat = CATEGORIES.find(c => c.id === existingListing.category.id);
        setSelectedCategory(cat || null);
        setImagePreviews(existingListing.images); // Show existing images
      } else if (!loadingListings) { // if listings loaded but not found or not owner
         navigate('/profile', {replace: true}); // or show error
      }
      setIsLoading(false);
    }
  }, [editingListingId, getListingById, user, navigate, loadingListings]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));

    if (name === 'categoryId') {
      const category = CATEGORIES.find(cat => cat.id === value);
      setSelectedCategory(category || null);
      setFormState(prev => ({ ...prev, subcategoryId: '' })); // Reset subcategory
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Limit number of images, e.g., to 5
      const newImages = filesArray.slice(0, 5 - imagePreviews.length);
      setFormState(prev => ({ ...prev, images: [...prev.images, ...newImages] }));

      const newImageUrls = newImages.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newImageUrls]);
    }
  };
  
  const removeImage = (indexToRemove: number) => {
    // If editing, this logic might need to distinguish between old URL strings and new File objects
    // For simplicity, this example removes from previews and new file list.
    // Real image deletion from storage would be more complex.
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    if(!isEditing || indexToRemove >= (listingToEdit?.images.length ?? 0) ){
       // removing a newly added image (File object)
        const newImageFileIndex = indexToRemove - (listingToEdit?.images.length ?? 0);
        setFormState(prev => ({
            ...prev,
            images: prev.images.filter((_,idx) => idx !== newImageFileIndex)
        }));
    } else {
        // This means we are "removing" an existing image URL. 
        // For mock, we just filter it from previews. Real app needs to handle this update.
        // For this mock, we'll assume updating images replaces all of them.
        // Or, we could mark them for deletion. For now, let's keep it simple.
    }

  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!user) {
      setError("Вы должны быть авторизованы для создания объявления.");
      setIsLoading(false);
      return;
    }
    if (!formState.categoryId || !formState.subcategoryId) {
        setError("Пожалуйста, выберите категорию и подкатегорию.");
        setIsLoading(false);
        return;
    }
    if (isEditing && !listingToEdit) {
        setError("Ошибка редактирования: объявление не найдено.");
        setIsLoading(false);
        return;
    }
    if (imagePreviews.length === 0 && !isEditing) { // For new listings, at least one image
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
    
    // In a real app, upload images to Firebase Storage first and get URLs
    // For mock, we'll use existing imagePreviews if editing and no new images are added,
    // or placeholder URLs if new files are "uploaded".
    let finalImageUrls: string[] = [];
    if (formState.images.length > 0) {
        // Simulate "uploading" new files
        finalImageUrls = formState.images.map((_, index) => `https://picsum.photos/seed/${Date.now() + index}/600/400`);
    } else if (isEditing && listingToEdit) {
        // If editing and no new files were selected, keep existing image URLs
        // This assumes imagePreviews still holds the original URLs if not modified by removeImage
        finalImageUrls = imagePreviews;
    }


    const listingData = {
      title: formState.title,
      description: formState.description,
      price: parseFloat(formState.price) || 0,
      condition: formState.condition as ProductCondition,
      category: category,
      subcategory: subcategory,
      city: formState.city,
      images: finalImageUrls.length > 0 ? finalImageUrls : (isEditing && listingToEdit ? listingToEdit.images : ['https://picsum.photos/seed/default/600/400']),
      sellerContact: formState.sellerContact,
    };

    try {
      let result;
      if (isEditing && listingToEdit) {
        result = await updateListing(listingToEdit.id, listingData);
      } else {
        result = await addListing(listingData);
      }

      if (result) {
        navigate(`/listing/${result.id}`);
      } else {
        setError("Не удалось сохранить объявление. Попробуйте снова.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка.");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isEditing && loadingListings && !listingToEdit) {
      return <div className="text-center p-8">Загрузка данных объявления...</div>;
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
                <label htmlFor="images" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                  <span>Загрузите файлы</span>
                  <input id="images" name="images" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageChange} disabled={imagePreviews.length >= 5} />
                </label>
                <p className="pl-1">или перетащите сюда</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF до 10MB</p>
            </div>
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {imagePreviews.map((previewUrl, index) => (
                <div key={index} className="relative group">
                  <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md shadow" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <XIcon className="w-3 h-3"/>
                  </button>
                </div>
              ))}
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
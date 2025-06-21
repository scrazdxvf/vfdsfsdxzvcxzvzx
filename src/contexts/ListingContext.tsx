import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Listing, Category, SubCategory, ProductCondition } from '../types';
import { db, storage, auth } from '../firebase';
import { 
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp, writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from './AuthContext';

interface NewListingData {
  title: string;
  description: string;
  price: number;
  condition: ProductCondition;
  category: Category;
  subcategory: SubCategory;
  city: string;
  images: File[]; // Use File[] for new uploads
  sellerContact: string;
}

interface UpdateListingData extends Partial<Omit<NewListingData, 'images'>> {
    newImages?: File[]; // For new images to be uploaded
    existingImageUrls?: string[]; // For images to keep
}


interface ListingContextType {
  listings: Listing[];
  loadingListings: boolean;
  addListing: (newListingData: NewListingData) => Promise<Listing | null>;
  updateListingStatus: (listingId: string, status: Listing['status']) => Promise<void>;
  getListingById: (id: string) => Promise<Listing | null>; // Now async
  getUserListings: (userId: string) => Promise<Listing[]>; // Now async
  fetchListings: () => Promise<void>;
  deleteListing: (listingId: string, imagePaths?: string[]) => Promise<void>;
  updateListing: (listingId: string, updatedData: UpdateListingData) => Promise<Listing | null>;
}

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const { user } = useAuth(); // To get sellerId and sellerUsername

  const uploadImages = async (listingId: string, imageFiles: File[]): Promise<string[]> => {
    if (!user) throw new Error("User not authenticated for image upload.");
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const imageRef = ref(storage, `listing-images/${user.id}/${listingId}/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      imageUrls.push(downloadURL);
    }
    return imageUrls;
  };
  
  const deleteImages = async (imageUrls: string[]): Promise<void> => {
    const batch = [];
    for (const url of imageUrls) {
        try {
            const imageRef = ref(storage, url); // Get ref from URL
            batch.push(deleteObject(imageRef));
        } catch (error) {
            console.warn(`Failed to create delete reference for image ${url}:`, error);
            // This can happen if the URL is not a Firebase Storage URL or malformed.
        }
    }
    await Promise.allSettled(batch).then(results => {
        results.forEach(result => {
            if (result.status === 'rejected') {
                console.error("Failed to delete an image:", result.reason);
            }
        });
    });
  };


  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const listingsCollection = collection(db, "listings");
      const q = query(listingsCollection, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedListings: Listing[] = [];
      querySnapshot.forEach((doc) => {
        fetchedListings.push({ id: doc.id, ...doc.data() } as Listing);
      });
      setListings(fetchedListings);
    } catch (error) {
      console.error("Error fetching listings: ", error);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const addListing = async (newListingData: NewListingData): Promise<Listing | null> => {
    if (!user) {
      console.error("User not logged in");
      throw new Error("User must be logged in to create a listing.");
    }
    setLoadingListings(true);
    const tempListingId = `temp-${Date.now()}`; // For image path before actual doc ID
    try {
      const imageUrls = await uploadImages(tempListingId, newListingData.images);
      
      const listingDocData = {
        ...newListingData,
        images: imageUrls,
        sellerId: user.id,
        sellerUsername: user.username || user.email?.split('@')[0] || 'Unknown Seller',
        createdAt: serverTimestamp(),
        status: 'pending_moderation' as Listing['status'],
      };
      
      const docRef = await addDoc(collection(db, "listings"), listingDocData);
      
      // If image paths used tempListingId, they ideally should be updated or use user.id/docRef.id structure from start
      // For simplicity, current uploadImages uses user.id/tempListingId. This is generally okay.

      const newListing = { id: docRef.id, ...listingDocData, createdAt: Timestamp.now() } as Listing; // Approximate createdAt for local state
      setListings(prev => [newListing, ...prev]);
      return newListing;
    } catch (error) {
      console.error("Error adding listing: ", error);
      // Attempt to delete uploaded images if doc creation failed
      if (newListingData.images.length > 0 && error) {
         console.warn("Attempting to clean up uploaded images due to error in addListing...");
         // This is tricky as we don't have the final URLs if uploadImages itself failed partially.
         // A more robust cleanup would involve tracking successful uploads.
      }
      return null;
    } finally {
      setLoadingListings(false);
    }
  };

  const updateListing = async (listingId: string, updatedData: UpdateListingData): Promise<Listing | null> => {
    if (!user) throw new Error("User not authenticated.");
    setLoadingListings(true);
    try {
        const listingRef = doc(db, "listings", listingId);
        const currentListingSnap = await getDoc(listingRef);
        if (!currentListingSnap.exists()) throw new Error("Listing not found.");
        const currentListingData = currentListingSnap.data() as Listing;

        if (currentListingData.sellerId !== user.id && !user.isAdmin) { // Check ownership or admin
            throw new Error("You are not authorized to update this listing.");
        }

        let finalImageUrls = updatedData.existingImageUrls || currentListingData.images || [];

        // Handle image deletions: find URLs present in currentListingData.images but not in updatedData.existingImageUrls
        const imagesToDelete = currentListingData.images.filter(url => !(updatedData.existingImageUrls || []).includes(url));
        if (imagesToDelete.length > 0) {
            await deleteImages(imagesToDelete);
        }
        
        // Handle new image uploads
        if (updatedData.newImages && updatedData.newImages.length > 0) {
            const newImageUrls = await uploadImages(listingId, updatedData.newImages);
            finalImageUrls = [...finalImageUrls, ...newImageUrls];
        }
        
        // Prepare the data object for Firestore update, excluding helper fields.
        const { newImages, existingImageUrls, ...restOfUpdatedData } = updatedData;
        
        const firestoreUpdateData: Partial<Listing> = {
            ...restOfUpdatedData,
            images: finalImageUrls,
            status: 'pending_moderation' as Listing['status'] // Re-moderate on significant edit
        };

        await updateDoc(listingRef, firestoreUpdateData);
        
        const updatedDocSnap = await getDoc(listingRef); // Re-fetch to get server timestamp etc.
        const updatedListing = { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Listing;
        
        setListings(prev => prev.map(l => l.id === listingId ? updatedListing : l));
        return updatedListing;

    } catch (error) {
        console.error("Error updating listing:", error);
        return null;
    } finally {
        setLoadingListings(false);
    }
};


  const updateListingStatus = async (listingId: string, status: Listing['status']): Promise<void> => {
    // Ensure only admin or specific logic can change status freely.
    // For now, assuming this is called by an authorized entity (e.g. admin panel)
    setLoadingListings(true);
    try {
      const listingRef = doc(db, "listings", listingId);
      await updateDoc(listingRef, { status });
      setListings(prevListings => 
        prevListings.map(l => l.id === listingId ? { ...l, status } : l)
      );
    } catch (error) {
      console.error("Error updating listing status: ", error);
    } finally {
      setLoadingListings(false);
    }
  };

  const deleteListing = async (listingId: string): Promise<void> => {
     if (!user) throw new Error("User not authenticated.");
    setLoadingListings(true);
    try {
      const listingRef = doc(db, "listings", listingId);
      const listingSnap = await getDoc(listingRef);
      if (!listingSnap.exists()) throw new Error("Listing not found.");
      
      const listingData = listingSnap.data() as Listing;
      if (listingData.sellerId !== user.id && !user.isAdmin) {
          throw new Error("You are not authorized to delete this listing.");
      }

      // Delete images from Storage
      if (listingData.images && listingData.images.length > 0) {
        await deleteImages(listingData.images);
      }
      
      await deleteDoc(listingRef);
      setListings(prevListings => prevListings.filter(l => l.id !== listingId));
    } catch (error) {
      console.error("Error deleting listing: ", error);
      throw error; // Re-throw for UI to handle
    } finally {
      setLoadingListings(false);
    }
  };

  const getListingById = async (id: string): Promise<Listing | null> => {
    setLoadingListings(true);
    try {
      const listingRef = doc(db, "listings", id);
      const docSnap = await getDoc(listingRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Listing;
      }
      return null;
    } catch (error) {
      console.error("Error fetching listing by ID: ", error);
      return null;
    } finally {
      setLoadingListings(false);
    }
  };

  const getUserListings = async (userId: string): Promise<Listing[]> => {
    setLoadingListings(true);
    try {
      const listingsCollection = collection(db, "listings");
      const q = query(listingsCollection, where("sellerId", "==", userId), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const userListings: Listing[] = [];
      querySnapshot.forEach((doc) => {
        userListings.push({ id: doc.id, ...doc.data() } as Listing);
      });
      return userListings;
    } catch (error) {
      console.error("Error fetching user listings: ", error);
      return [];
    } finally {
      setLoadingListings(false);
    }
  };

  return (
    <ListingContext.Provider value={{ 
        listings, 
        loadingListings, 
        addListing, 
        updateListingStatus, 
        getListingById, 
        getUserListings, 
        fetchListings, 
        deleteListing,
        updateListing 
    }}>
      {children}
    </ListingContext.Provider>
  );
};

export const useListings = (): ListingContextType => {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingProvider');
  }
  return context;
};
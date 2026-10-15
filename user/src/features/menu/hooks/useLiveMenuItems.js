import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';

export const useLiveMenuItems = () => {
  const [items, setItems] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const menuRef = collection(db, 'menu_items');
      const unsubscribe = onSnapshot(
        menuRef,
        (snapshot) => {
          const liveItems = [];
          snapshot.forEach((docSnap) => {
            liveItems.push({
              id: docSnap.id,
              ...docSnap.data(),
            });
          });

          // Sort by name or creation
          liveItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

          setItems(liveItems);

          // Filter popular items for homepage
          const popular = liveItems.filter((item) => item.popular === true);
          setPopularItems(popular.length > 0 ? popular : liveItems.slice(0, 4));

          // Extract dynamic unique categories directly from live items
          const uniqueCategories = [
            'All',
            ...new Set(liveItems.map((item) => item.category).filter(Boolean)),
          ];
          setCategories(uniqueCategories);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore real-time menu sync error:', error);
          setItems([]);
          setPopularItems([]);
          setCategories(['All']);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Firestore menu initialization failed:', err);
      setItems([]);
      setPopularItems([]);
      setCategories(['All']);
      setLoading(false);
    }
  }, []);

  return {
    items,
    popularItems,
    categories,
    loading,
  };
};

import React, { createContext, useContext, useState, useEffect } from 'react';
const RecentlyViewedContext = /*#__PURE__*/createContext();
export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};
export const RecentlyViewedProvider = ({
  children
}) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Load from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('recentlyViewed');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentlyViewed(parsed);
      } catch (error) {
        console.error('Error parsing recently viewed from session storage:', error);
        sessionStorage.removeItem('recentlyViewed');
      }
    }
  }, []);

  // Save to session storage whenever recentlyViewed changes
  useEffect(() => {
    sessionStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);
  const addRecentlyViewed = entity => {
    if (!entity || !entity.id || !entity.name || !entity.type) {
      console.warn('Invalid entity passed to addRecentlyViewed:', entity);
      return;
    }
    setRecentlyViewed(prev => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter(item => !(item.id === entity.id && item.type === entity.type));

      // Add to front of array
      const updated = [entity, ...filtered];

      // Keep only the 10 most recent
      return updated.slice(0, 10);
    });
  };
  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    sessionStorage.removeItem('recentlyViewed');
  };
  return /*#__PURE__*/React.createElement(RecentlyViewedContext.Provider, {
    value: {
      recentlyViewed,
      addRecentlyViewed,
      clearRecentlyViewed
    }
  }, children);
};
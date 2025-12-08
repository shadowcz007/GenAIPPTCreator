
import { HistoryItem } from '../types';

const HISTORY_KEY = 'GENAI_PPT_HISTORY';

export const getHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const saveHistoryItem = (item: HistoryItem): boolean => {
  try {
    const history = getHistory();
    const index = history.findIndex(h => h.id === item.id);
    
    let newHistory = [...history];
    if (index >= 0) {
      // Update existing
      newHistory[index] = item;
      // Move to top
      newHistory.splice(index, 1);
      newHistory.unshift(item);
    } else {
      // Add new
      newHistory.unshift(item);
    }

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return true;
    } catch (e: any) {
      // Handle QuotaExceededError
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        // If only one item and it fails, we can't save it (too big)
        if (newHistory.length <= 1) {
          console.error("Presentation too large to save locally.");
          return false;
        }
        
        // Try removing the last (oldest) item and retry
        console.warn("Storage full, removing oldest item...");
        newHistory.pop(); 
        
        // Recursive retry logic (simplified)
        // We do this manually to avoid infinite recursion if current item is just huge
        try {
           localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
           return true;
        } catch (retryError) {
           console.error("Still failed to save after cleanup", retryError);
           return false;
        }
      }
      throw e;
    }
  } catch (e) {
    console.error("Failed to save history", e);
    return false;
  }
};

export const deleteHistoryItem = (id: string) => {
  const history = getHistory();
  const newHistory = history.filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  return newHistory;
};

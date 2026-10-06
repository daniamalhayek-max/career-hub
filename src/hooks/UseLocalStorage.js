import { useState, useEffect } from 'react';

// Works like useState, but the value is also saved in localStorage
// under `key`, so it's still there after a refresh.
function useLocalStorage(key, startValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : startValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue]; // the same shape as useState
}

export default useLocalStorage;
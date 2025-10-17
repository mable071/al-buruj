import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client.js";

export function useData(endpoint, options = {}) {
  const [data, setData] = useState(options.initialData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await api(endpoint);
      setData(result);
      setLastFetch(Date.now());
    } catch (err) {
      // Don't set error for network issues if we have cached data
      if (data && data.length > 0) {
        console.warn(`Network error for ${endpoint}, using cached data:`, err);
      } else {
        setError(err.message || "Failed to fetch data");
        console.error(`Error fetching ${endpoint}:`, err);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, data]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!options.autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData, options.autoRefresh]);

  return {
    data,
    loading,
    error,
    refresh,
    lastFetch
  };
}

export function useMutation(endpoint, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (data, method = "POST") => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api(endpoint, {
        method,
        body: JSON.stringify(data)
      });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err.message || "Operation failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  return {
    mutate,
    loading,
    error
  };
}

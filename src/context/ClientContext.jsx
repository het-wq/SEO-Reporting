import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getBackendBase } from '@/lib/backendBase';

const ClientContext = createContext(null);
const STORAGE_CLIENT_KEY = 'seo_selected_client_id';

const BACKEND_BASE = getBackendBase();

export function ClientProvider({ children }) {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_CLIENT_KEY) || null;
    } catch {
      return null;
    }
  });

  // Fetch list of clients from backend / Supabase
  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/clients`, {
        credentials: 'include',
      });
      if (res.ok) {
        const body = await res.json();
        const clientList = body.clients || [];
        setClients(clientList);

        // If no client selected or selected client no longer exists, select first client
        if (clientList.length > 0) {
          const currentValid = clientList.some((c) => c.id === selectedClientId);
          if (!currentValid) {
            const firstId = clientList[0].id;
            setSelectedClientId(firstId);
            try {
              localStorage.setItem(STORAGE_CLIENT_KEY, firstId);
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load clients list:', e.message);
    } finally {
      setLoadingClients(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const switchClient = useCallback((clientId) => {
    if (!clientId) return;
    setSelectedClientId(clientId);
    try {
      localStorage.setItem(STORAGE_CLIENT_KEY, clientId);
    } catch {
      // ignore
    }
  }, []);

  const selectedClient = useMemo(() => {
    if (!clients.length) return null;
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  const value = useMemo(() => ({
    clients,
    selectedClientId: selectedClient?.id || selectedClientId,
    selectedClient,
    switchClient,
    refreshClients: loadClients,
    loadingClients,
  }), [clients, selectedClientId, selectedClient, switchClient, loadClients, loadingClients]);

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return ctx;
}

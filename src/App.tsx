/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useAuthStore } from './store/authStore';

import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InboxPage from './pages/InboxPage';
import ContactsPage from './pages/ContactsPage';
import BroadcastPage from './pages/BroadcastPage';
import TemplatesPage from './pages/TemplatesPage';
import AutoReplyPage from './pages/AutoReplyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AutomationsPage from './pages/AutomationsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SettingsPage from './pages/SettingsPage';
import ApiSettingsPage from './pages/ApiSettingsPage';
import PublicPreferencePage from './pages/PublicPreferencePage';

import { useAutoReply } from './hooks/useAutoReply';

export default function App() {
  const { setUser, setAccessToken } = useAuthStore();
  useAutoReply();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // In a real app we'd refresh the token, but for now we assume it's coming from the login interaction.
        // Or we could use user.getIdToken() if we needed it for our backend.
      } else {
        setUser(null);
        setAccessToken(null);
      }
    });
    return () => unsubscribe();
  }, [setUser, setAccessToken]);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid #1E293B',
          borderRadius: '12px'
        }
      }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/broadcast" element={<BroadcastPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/auto-reply" element={<AutoReplyPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/api" element={<ApiSettingsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="/preferences/:contactId" element={<PublicPreferencePage />} />
        <Route path="/unsubscribe/:contactId" element={<PublicPreferencePage />} />
        
        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </Router>
  );
}


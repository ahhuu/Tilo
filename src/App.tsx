import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { TodayPage } from '@/pages/TodayPage';
import { InboxPage } from '@/pages/InboxPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProjectPage } from '@/pages/ProjectPage';
import { db, ensureDefaultWorkspace } from '@/storage/db';
import { seedDemoData } from '@/storage/seed';

export const App: React.FC = () => {
  useEffect(() => {
    async function initDB() {
      await ensureDefaultWorkspace(db);
      const count = await db.tasks.count();
      if (count === 0) {
        await seedDemoData(db);
      }
    }
    initDB().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './app/Layout';
import { ObjectsPage } from './features/objects/ObjectsPage';
import { ObjectDetailPage } from './features/objects/ObjectDetailPage';
import { ListsPage } from './features/lists/ListsPage';
import { ListDetailPage } from './features/lists/ListDetailPage';
import { SchedulesPage } from './features/schedules/SchedulesPage';
import { PlansPage } from './features/plans/PlansPage';
import { PlanDetailPage } from './features/plans/PlanDetailPage';
import { SettingsPage } from './features/settings/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ObjectsPage />} />
          <Route path="objects/:id" element={<ObjectDetailPage />} />
          <Route path="lists" element={<ListsPage />} />
          <Route path="lists/:id" element={<ListDetailPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="plans/:id" element={<PlanDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

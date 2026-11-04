import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './app/Layout';

const ObjectsPage = lazy(() =>
  import('./features/objects/ObjectsPage').then((m) => ({ default: m.ObjectsPage })),
);
const ObjectDetailPage = lazy(() =>
  import('./features/objects/ObjectDetailPage').then((m) => ({ default: m.ObjectDetailPage })),
);
const ListsPage = lazy(() =>
  import('./features/lists/ListsPage').then((m) => ({ default: m.ListsPage })),
);
const ListDetailPage = lazy(() =>
  import('./features/lists/ListDetailPage').then((m) => ({ default: m.ListDetailPage })),
);
const SchedulesPage = lazy(() =>
  import('./features/schedules/SchedulesPage').then((m) => ({ default: m.SchedulesPage })),
);
const PlansPage = lazy(() =>
  import('./features/plans/PlansPage').then((m) => ({ default: m.PlansPage })),
);
const PlanDetailPage = lazy(() =>
  import('./features/plans/PlanDetailPage').then((m) => ({ default: m.PlanDetailPage })),
);
const BenefitsPage = lazy(() =>
  import('./features/benefits/BenefitsPage').then((m) => ({ default: m.BenefitsPage })),
);
const HabitsPage = lazy(() =>
  import('./features/habits/HabitsPage').then((m) => ({ default: m.HabitsPage })),
);
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

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
          <Route path="benefits" element={<BenefitsPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

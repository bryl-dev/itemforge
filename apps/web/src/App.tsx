import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BankPage } from './pages/BankPage';
import { MetricsPage } from './pages/MetricsPage';
import { ReviewPage } from './pages/ReviewPage';
import { SourcesPage } from './pages/SourcesPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<SourcesPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="bank" element={<BankPage />} />
          <Route path="metrics" element={<MetricsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

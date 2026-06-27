import { Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import DocumentListPage from './pages/DocumentListPage.jsx';

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/edit/:id" element={<App />} />
      <Route path="/documents" element={<DocumentListPage />} />
    </Routes>
  );
}

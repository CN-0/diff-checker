import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TextCompare from './pages/TextCompare';
import JsonValidator from './pages/JsonValidator';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/text-compare" element={<TextCompare />} />
      <Route path="/json-validator" element={<JsonValidator />} />
    </Routes>
  );
}

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TextCompare from './pages/TextCompare';
import JsonValidator from './pages/JsonValidator';
import YamlValidator from './pages/YamlValidator';
import TimeConverter from './pages/TimeConverter';
import CodeCleaner from './pages/CodeCleaner';
import Verify from './pages/Verify';
import PageMeta from './components/PageMeta';
import { routes } from './seo/routes';

// Components for the public routes in src/seo/routes.js.
// A new page needs an entry there and a component here.
const PAGES = {
  '/': Home,
  '/text-compare': TextCompare,
  '/json-validator': JsonValidator,
  '/yaml-validator': YamlValidator,
  '/time-converter': TimeConverter,
  '/code-cleaner': CodeCleaner,
  '/verify': Verify,
};

if (import.meta.env.DEV) {
  for (const route of routes) {
    if (!PAGES[route.path]) {
      console.warn(`[seo] No page component for ${route.path}. Add it to PAGES in App.jsx.`);
    }
  }
}

export default function App() {
  return (
    <>
      <PageMeta />
      <Routes>
        {routes.map((route) => {
          const Page = PAGES[route.path];
          if (!Page) return null;
          return <Route key={route.path} path={route.path} element={<Page />} />;
        })}
      </Routes>
    </>
  );
}

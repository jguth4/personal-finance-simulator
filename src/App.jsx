import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Budget from './pages/Budget';
import Investing from './pages/Investing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/investing" element={<Investing />} />
      </Routes>
    </BrowserRouter>
  );
}

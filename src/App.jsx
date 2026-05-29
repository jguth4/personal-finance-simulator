import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Budget from './pages/Budget';
import Investing from './pages/Investing';
import Simulation from './pages/Simulation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/investing" element={<Investing />} />
        <Route path="/simulation" element={<Simulation />} />
      </Routes>
    </BrowserRouter>
  );
}

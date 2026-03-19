import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import LandingPage from './pages/LandingPage';
import DesktopGame from '@/features/games/components/DesktopGame';
import MobileController from '@/features/controller/components/MobileController';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<DesktopGame />} />
      <Route 
        path="/controller" 
        element={
          <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-mono">Initializing Protocol...</div>}>
            <MobileController />
          </Suspense>
        } 
      />
    </Routes>
  );
}

export default App;

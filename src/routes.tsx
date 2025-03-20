import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/home';
import Palpites from './pages/Palpites/palpites';
import Classificacao from './pages/Classificacao/classificacao';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/palpites" element={<Palpites />} />
      <Route path="/classificacao" element={<Classificacao />} />
    </Routes>
  );
};

export default AppRoutes;

import { House, Menu, Trophy, Volleyball, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex h-auto">
      <div className="fixed top-12 left-0 p-4 min-lg:hidden">
        <button className="focus:outline-none" onClick={toggleSidebar}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <div
        className={`
      fixed inset-y-0 left-0 transform text-red-500
      ${isOpen ? 'translate-x-0' : '-translate-x-full sm:w-16 sm:translate-x-0'}
      ransition-transform duration-300 ease-in-out bg-black text-red-500 w-64 p-4 h-full md:relative md:translate-x-0 md:transform-none
    `}
      >
        <button className="focus:outline-none" onClick={toggleSidebar}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2
          className={`text-2xl mb-6 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Flamengo - BR 2025
        </h2>
        <nav>
          <ul>
            <li className="mb-4">
              <Link to="/home" className="text-lg hover:text-gray-300">
                {isOpen ? (
                  <div className="flex items-center">
                    <House /> <span className="ml-2">Home</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <House />
                  </div>
                )}
              </Link>
              <Link to="/palpites" className="text-lg hover:text-gray-300">
                {isOpen ? (
                  <div className="flex items-center mt-4">
                    <Volleyball /> <span className="ml-2">Palpites</span>
                  </div>
                ) : (
                  <div className="flex items-center mt-4">
                    <Volleyball />
                  </div>
                )}
              </Link>
              <Link to="/classificacao" className="text-lg hover:text-gray-300">
                {isOpen ? (
                  <div className="flex items-center mt-4">
                    <Trophy /> <span className="ml-2">Classificação</span>
                  </div>
                ) : (
                  <div className="flex items-center mt-4">
                    <Trophy />
                  </div>
                )}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

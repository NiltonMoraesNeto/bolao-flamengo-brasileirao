import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import Modal from './modal';

const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const userIconRef = useRef<HTMLButtonElement>(null);

  const toggleModal = () => {
    if (!isModalOpen && userIconRef.current) {
      const rect = userIconRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setIsModalOpen(!isModalOpen);
  };

  return (
    <header className="bg-black text-red-500 p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link to="/home" className="text-2xl font-bold hover:text-gray-300">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg"
            width={30}
          />
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <button
          ref={userIconRef}
          className="focus:outline-none hover:text-gray-300"
          onClick={toggleModal}
        >
          <Bell size={24} />
        </button>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={toggleModal}
        position={modalPosition}
      />
    </header>
  );
};

export default Header;

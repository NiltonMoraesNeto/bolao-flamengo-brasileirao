import { ArrowLeft, Home, Menu, Trophy, Volleyball } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/auth-context";

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  const { dataUser } = useAuth();

  function getGreeting() {
    const now = new Date();
    const hours = now.getHours();

    if (hours < 12) {
      return "Bom Dia";
    } else if (hours < 18) {
      return "Boa Tarde";
    } else {
      return "Boa Noite";
    }
  }

  return (
    <div className="flex h-auto">
      <div className="fixed top-13 left-0 p-4 min-md:hidden text-red-500">
        <button className="focus:outline-none" onClick={toggleSidebar}>
          {isOpen ? <ArrowLeft size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <div
        className={`
      fixed inset-y-0 left-0 transform text-red-500
      ${isOpen ? "translate-x-0" : "-translate-x-full sm:w-16 sm:translate-x-0"}
      ransition-transform duration-300 ease-in-out bg-black text-red-500 w-64 p-4 h-full md:relative md:translate-x-0 md:transform-none
    `}
      >
        <button className="focus:outline-none" onClick={toggleSidebar}>
          {isOpen ? <ArrowLeft size={24} /> : <Menu size={24} />}
        </button>
        <h2
          className={`text-2xl mb-6 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="">{getGreeting()}</div>
          <div className="">{dataUser?.nome}</div>
        </h2>
        <nav>
          <ul>
            <Separator orientation="horizontal" className="mb-4 bg-red-500" />
            <li className="mb-4">
              <Link to="/home" className="text-lg hover:text-gray-300">
                {isOpen ? (
                  <div className="flex items-center">
                    <Home /> <span className="ml-2">Home</span>
                  </div>
                ) : (
                  <Home />
                )}
              </Link>
            </li>
            <Separator orientation="horizontal" className="mb-4 bg-red-500" />
            <li className="mb-4">
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
            </li>
            <Separator orientation="horizontal" className="mb-4 bg-red-500" />
            <li className="mb-4">
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
            <Separator orientation="horizontal" className="mb-4 bg-red-500" />
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

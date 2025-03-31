import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/auth-context";
import { ThemeToggle } from "./theme-toogle";

const Header: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-black text-red-500 p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link to="/home" className="text-2xl font-bold hover:text-gray-300">
          <img src="/flamengo_logo.png" width={30} />
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <Button className="focus:outline-none bg-red-500 hover:bg-red-400 text-black hover:text-gray-300">
          <Bell size={24} />
        </Button>
        <Button
          className="focus:outline-none bg-red-500 hover:bg-red-400 text-black hover:text-gray-300"
          onClick={handleLogout}
        >
          <LogOut size={24} />
        </Button>
      </div>
    </header>
  );
};

export default Header;

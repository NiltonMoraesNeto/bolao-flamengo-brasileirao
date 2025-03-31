import React from "react";

interface AlertProps {
  message: string;
  type?: "error" | "success" | "warning" | "info";
}

const Alert: React.FC<AlertProps> = ({ message, type = "error" }) => {
  const getAlertStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-400 text-green-700";
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-700";
      case "info":
        return "bg-blue-100 border-blue-400 text-blue-700";
      case "error":
      default:
        return "bg-red-100 border-red-400 text-red-700";
    }
  };

  return (
    <div
      className={`border-l-4 p-4 ${getAlertStyles()} rounded-md mb-4`}
      role="alert"
    >
      <p className="font-bold">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </p>
      <p>{message}</p>
    </div>
  );
};

export default Alert;

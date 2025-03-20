import React from "react";

interface BadgeProps {
  text: string;
  type?: "default" | "success" | "error" | "warning" | "info";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ text, type = "default", className = "" }) => {
  const getBadgeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      case "default":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${getBadgeStyles()} ${className}`}>
      {text}
    </span>
  );
};

export default Badge;
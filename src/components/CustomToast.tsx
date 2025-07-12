"use client";
import { useEffect } from "react";

interface CustomToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export default function CustomToast({ message, type = "info", duration = 3500, onClose }: CustomToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "#28a745",
    error: "#dc3545",
    info: "#007bff"
  }[type];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        background: bgColor,
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 8,
        fontWeight: "bold",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        zIndex: 9999
      }}
    >
      {message}
    </div>
  );
}

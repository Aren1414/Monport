"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastData {
  message: string;
  type: ToastType;
  duration: number;
}

type ToastContextType = (message: string, type?: ToastType, duration?: number) => void;

const ToastContext = createContext<ToastContextType>(() => {});

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast: ToastContextType = (
    message,
    type = "info",
    duration = type === "error" ? 6000 : 3500
  ) => {
    setToast({ message, type, duration });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.duration);
    return () => clearTimeout(timer);
  }, [toast]);

  const bgColor = {
    success: "#28a745",
    error: "#dc3545",
    info: "#007bff"
  }[toast?.type || "info"];

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {!!toast && (
        <div
          style={{
            position: "fixed",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
            background: bgColor,
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: "bold",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            zIndex: 9999,
            maxWidth: "80%",
            textAlign: "center"
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  return useContext(ToastContext);
}

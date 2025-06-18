import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  ...props
}) {
  const modalRef = useRef(null);

  // Définir les classes de taille
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4"
  };

  const sizeClass = sizes[size] || sizes.md;

  // Gérer la fermeture avec la touche Escape
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (closeOnEscape && e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden"; // Empêcher le défilement du body
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = ""; // Restaurer le défilement
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Gérer les clics à l'extérieur du modal
  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleOutsideClick}
    >
      <div
        ref={modalRef}
        className={`${sizeClass} w-full bg-white dark:bg-zinc-800 rounded-lg shadow-xl overflow-hidden ${className}`}
        {...props}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({ className = "", ...props }) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-700 ${className}`}
      {...props}
    />
  );
}

export function ModalBody({ className = "", ...props }) {
  return (
    <div className={`p-6 overflow-y-auto ${className}`} {...props} />
  );
}

export function ModalFooter({ className = "", ...props }) {
  return (
    <div
      className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 ${className}`}
      {...props}
    />
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import '@/styles/design-modal.css';

type ModalSize = 'small' | 'medium' | 'large';

export interface DesignModalProps {
  isOpen?: boolean;
  title?: string;
  onClose?: () => void;
  size?: ModalSize;
  className?: string;
  children?: React.ReactNode;
}

export const DesignModal: React.FC<DesignModalProps> = ({
  isOpen = false,
  title = '',
  onClose = () => {},
  size = 'medium',
  className = '',
  children,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [lastActiveElement, setLastActiveElement] = useState<HTMLElement | null>(null);
  const originalBodyOverflow = useRef<string>('');

  const lockBodyScroll = () => {
    originalBodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  };

  const unlockBodyScroll = () => {
    document.body.style.overflow = originalBodyOverflow.current;
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleBackdropKeydown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }

    if (event.key === 'Tab' && isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<
        HTMLButtonElement | HTMLAnchorElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement
      >('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  const handleContentWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const content = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = content;

    if (
      (event.deltaY < 0 && scrollTop <= 0) ||
      (event.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)
    ) {
      event.stopPropagation();
    }
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLastActiveElement(document.activeElement as HTMLElement);
      document.addEventListener('keydown', handleKeydown);
      lockBodyScroll();

      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }, 50);
    } else {
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();

      if (lastActiveElement) {
        lastActiveElement.focus();
      }
    }
  }, [isOpen, lastActiveElement]);

  if (!isOpen) return null;

  return (
    <div
      className="design-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'design-modal-title' : undefined}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeydown}
      tabIndex={-1}
    >
      <div className={`design-modal design-modal--${size} ${className}`} ref={modalRef}>
        <div className="design-modal__header">
          {title && (
            <h2 id="design-modal-title" className="design-modal__title">
              {title}
            </h2>
          )}
          <button
            type="button"
            className="design-modal__close-button"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="design-modal__content" onWheel={handleContentWheel}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DesignModal;

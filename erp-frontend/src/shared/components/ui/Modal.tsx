import React from 'react';
import { clsx } from 'clsx';
import { DesignModal } from './DesignModal';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  xl: 'large',
  full: 'large',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const designSize = sizeMap[size] || 'medium';

  return (
    <DesignModal isOpen={isOpen} onClose={onClose} title={title} size={designSize}>
      {children}
    </DesignModal>
  );
};

export interface ModalFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  align = 'right',
}) => {
  const alignments = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50',
        alignments[align]
      )}
    >
      {children}
    </div>
  );
};


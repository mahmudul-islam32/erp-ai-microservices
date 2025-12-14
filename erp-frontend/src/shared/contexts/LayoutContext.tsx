import React, { createContext, useContext, useMemo } from 'react';
import { useAppearance } from './AppearanceContext';

type LayoutType = 'vertical' | 'horizontal';

interface LayoutContextType {
  layoutType: LayoutType;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useAppearance();
  
  const layoutType = useMemo<LayoutType>(() => {
    const type = settings?.layout_type || 'vertical';
    return type as LayoutType;
  }, [settings]);

  return (
    <LayoutContext.Provider value={{ layoutType }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    return { layoutType: 'vertical' as LayoutType };
  }
  return context;
};

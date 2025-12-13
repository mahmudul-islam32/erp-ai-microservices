import React, { useState, useEffect, useMemo } from 'react';
import { useAppearance } from '../../contexts/AppearanceContext';

import '@/styles/icon.css';

export type IconSize = 'small' | 'default' | 'large';
export type IconVariant = 'primary' | 'secondary';

export interface IconProps {
  name: string;
  size?: IconSize;
  strokeWidth?: string;
  variant?: IconVariant;
  color?: string; // Optional direct color override
  className?: string;
}

// SVG cache shared across all Icon instances
const svgCache = new Map<string, string>();

function getDimensions(size: IconSize): { width: string; height: string } {
  switch (size) {
    case 'small':
      return { width: '16px', height: '16px' };
    case 'large':
      return { width: '32px', height: '32px' };
    case 'default':
    default:
      return { width: '24px', height: '24px' };
  }
}

function getPlaceholderSVG(name: string, width: string, height: string): string {
  return `<img src="/assets/icons/${name}.svg" alt="${name}" width="${width}" height="${height}" />`;
}

async function loadSvg(name: string): Promise<string | null> {
  if (svgCache.has(name)) {
    return svgCache.get(name)!;
  }

  try {
    const response = await fetch(`/assets/icons/${name}.svg`);
    if (!response.ok) {
      throw new Error(`Failed to load icon: ${response.statusText}`);
    }
    const rawSvg = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (svgEl) {
      // Remove defs
      svgEl.querySelectorAll('defs').forEach((defs) => defs.remove());
      // Remove fill attributes
      svgEl.querySelectorAll('[fill]').forEach((el) => el.removeAttribute('fill'));
      // Remove stroke attributes
      svgEl.querySelectorAll('[stroke]').forEach((el) => el.removeAttribute('stroke'));

      // Remove style attributes with fill or stroke
      svgEl.querySelectorAll('[style]').forEach((el) => {
        const style = el.getAttribute('style');
        if (style && (style.includes('fill') || style.includes('stroke'))) {
          el.removeAttribute('style');
        }
      });

      const cleanedSvg = svgEl.outerHTML;
      svgCache.set(name, cleanedSvg);
      return cleanedSvg;
    }
  } catch (error) {
    console.warn(`Failed to load icon ${name}:`, error);
    return null;
  }

  return null;
}

function processSvg(
  rawSvg: string,
  currentSize: IconSize,
  currentStrokeWidth: string,
  currentVariant: IconVariant,
  customColor?: string,
): string {
  if (!rawSvg) return '';

  const { width, height } = getDimensions(currentSize);
  const iconColor = customColor || `var(--icon-color-${currentVariant})`;

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  if (svgEl) {
    svgEl.setAttribute('stroke', iconColor);
    svgEl.setAttribute('fill', iconColor);
    svgEl.setAttribute('stroke-width', currentStrokeWidth);
    svgEl.setAttribute('width', width);
    svgEl.setAttribute('height', height);

    return svgEl.outerHTML;
  }

  return rawSvg;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size: sizeProp,
  strokeWidth = '0',
  variant = 'primary',
  color,
  className = '',
}) => {
  const { settings } = useAppearance();
  
  // Get default size from settings, fallback to 'default' if not set
  const defaultSize = (settings?.icon_default_size as IconSize) || 'default';
  const size = sizeProp || defaultSize; // Use prop if provided, otherwise use default from settings
  
  const [rawSvgContent, setRawSvgContent] = useState<string>('');
  const [processedSvgContent, setProcessedSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const dimensions = useMemo(() => getDimensions(size), [size]);

  // Load SVG on mount and when name changes
  useEffect(() => {
    setIsLoading(true);

    loadSvg(name).then((loadedSvg) => {
      if (loadedSvg) {
        setRawSvgContent(loadedSvg);
        const processed = processSvg(loadedSvg, size, strokeWidth, variant, color);
        setProcessedSvgContent(processed);
      } else {
        const placeholder = getPlaceholderSVG(name, dimensions.width, dimensions.height);
        setRawSvgContent(placeholder);
        setProcessedSvgContent(placeholder);
      }
      setIsLoading(false);
    });
  }, [name, size, dimensions.width, dimensions.height]);

  // Reprocess SVG when size, strokeWidth, variant, or color changes
  useEffect(() => {
    if (rawSvgContent && !isLoading) {
      const processed = processSvg(rawSvgContent, size, strokeWidth, variant, color);
      setProcessedSvgContent(processed);
    }
  }, [rawSvgContent, size, strokeWidth, variant, color, isLoading, defaultSize]);

  if (isLoading) {
    return (
      <div
        className={`icon-wrapper icon-loading ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
        aria-label={`Loading icon ${name}`}
      />
    );
  }

  return (
    <div
      className={`icon-wrapper ${className}`}
      style={{ minWidth: dimensions.width, minHeight: dimensions.height }}
      aria-label={`Icon ${name}`}
      dangerouslySetInnerHTML={{ __html: processedSvgContent }}
    />
  );
};

export default Icon;

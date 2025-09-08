import React, { useState, useEffect } from 'react';
import { isBlobUrl, isValidImageUrl, getFallbackImageUrl, revokeBlobUrl } from '../../utils/imageUtils';

interface ProductImageProps {
  src?: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  fallbackToInitial?: boolean;
  onError?: () => void;
  onLoad?: () => void;
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  width = 48,
  height = 48,
  style = {},
  className = '',
  fallbackToInitial = true,
  onError,
  onLoad
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src && isValidImageUrl(src)) {
      setImageSrc(src);
      setHasError(false);
      setIsLoading(true);
    } else {
      setImageSrc(null);
      setHasError(true);
      setIsLoading(false);
    }
  }, [src]);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
    
    // Warn about blob URL issues
    if (src && isBlobUrl(src)) {
      console.warn('Product image blob URL failed to load:', src);
    }
    
    onError?.();
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // Warn about blob URL usage
    if (src && isBlobUrl(src)) {
      console.warn('Product image is using blob URL, which may not persist:', src);
    }
    
    onLoad?.();
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (src && isBlobUrl(src)) {
        revokeBlobUrl(src);
      }
    };
  }, [src]);

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'var(--sap-neutral-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
    ...style
  };

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--sap-neutral-200)',
    color: 'var(--sap-text-tertiary)',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  };

  if (hasError || !imageSrc) {
    return (
      <div style={containerStyle} className={className}>
        <div style={placeholderStyle}>
          {fallbackToInitial ? alt.charAt(0).toUpperCase() : '?'}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--sap-neutral-100)',
          fontSize: '10px',
          color: 'var(--sap-text-tertiary)'
        }}>
          Loading...
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default ProductImage;

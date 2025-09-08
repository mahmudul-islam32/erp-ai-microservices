/**
 * Utility functions for handling product images
 */

/**
 * Check if a URL is a blob URL
 */
export const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

/**
 * Check if a URL is a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a blob URL
  if (isBlobUrl(url)) return true;
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Get a fallback image URL or placeholder
 */
export const getFallbackImageUrl = (productName: string): string => {
  // You can replace this with a default product image URL
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" fill="#f3f4f6"/>
      <text x="24" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#6b7280">
        ${productName.charAt(0).toUpperCase()}
      </text>
    </svg>
  `)}`;
};

/**
 * Convert blob URL to base64 for persistence (if needed)
 */
export const blobToBase64 = (blobUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = blobUrl;
  });
};

/**
 * Clean up blob URLs to prevent memory leaks
 */
export const revokeBlobUrl = (url: string): void => {
  if (isBlobUrl(url)) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Clean up multiple blob URLs
 */
export const revokeBlobUrls = (urls: string[]): void => {
  urls.forEach(revokeBlobUrl);
};

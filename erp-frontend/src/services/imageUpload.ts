import axios from 'axios';

// Image upload service
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}

class ImageUploadService {
  private baseURL: string;

  constructor() {
    // Backend URL for file uploads
    this.baseURL = 'http://localhost:8002/upload';
  }

  /**
   * Upload a single image file
   */
  async uploadImage(
    file: File, 
    productId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('productId', productId);
    formData.append('type', 'product');

    try {
      // Make actual HTTP request to backend
      const response = await axios.post(`${this.baseURL}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            onProgress(progress);
          }
        },
      });

      return {
        url: response.data.url,
        filename: response.data.filename,
        size: response.data.size,
        type: response.data.type
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fallback to blob URL for development/testing
      console.warn('Backend upload failed, using blob URL as fallback');
      return {
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        type: file.type
      };
    }
  }

  /**
   * Upload multiple image files
   */
  async uploadImages(
    files: File[], 
    productId: string,
    onProgress?: (filename: string, progress: UploadProgress) => void
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadImage(file, productId, (progress) => {
        onProgress?.(file.name, progress);
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete an uploaded image
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL for deletion
      const filename = imageUrl.split('/').pop();
      if (!filename) {
        throw new Error('Invalid image URL');
      }
      
      // Make HTTP DELETE request to backend
      await axios.delete(`${this.baseURL}/image/${filename}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Simulate upload process (replace with actual implementation)
   */
  private async simulateUpload(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const total = file.size;
      let loaded = 0;
      
      const interval = setInterval(() => {
        loaded += Math.random() * (total / 10);
        
        if (loaded >= total) {
          loaded = total;
          clearInterval(interval);
          
          // Simulate successful upload
          const response: UploadResponse = {
            url: URL.createObjectURL(file), // In real app, this would be server URL
            filename: file.name,
            size: file.size,
            type: file.type
          };
          
          resolve(response);
        }
        
        const progress: UploadProgress = {
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100)
        };
        
        onProgress?.(progress);
      }, 100);
    });
  }

  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be an image (JPEG, PNG, WEBP, or GIF)' };
    }
    
    return { valid: true };
  }

  /**
   * Get image preview URL
   */
  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke object URL to free memory
   */
  revokeImagePreview(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService;

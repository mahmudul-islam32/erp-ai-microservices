import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    // Create uploads directory if it doesn't exist
    this.uploadPath = path.join(process.cwd(), 'uploads', 'images');
    this.publicUrl = this.configService.get<string>('PUBLIC_URL', 'http://localhost:8002');
    
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadImage(file: any): Promise<UploadResult> {
    try {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadPath, uniqueFilename);

      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Generate public URL
      const publicUrl = `${this.publicUrl}/uploads/images/${uniqueFilename}`;

      return {
        url: publicUrl,
        filename: file.originalname,
        size: file.size,
        type: file.mimetype
      };
    } catch (error) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, filename);

      // Check if file exists and delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  getImagePath(filename: string): string {
    return path.join(this.uploadPath, filename);
  }
}

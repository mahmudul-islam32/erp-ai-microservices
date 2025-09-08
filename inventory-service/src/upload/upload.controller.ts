import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Request, Response } from 'express';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Public URL of the uploaded image' },
        filename: { type: 'string', description: 'Original filename' },
        size: { type: 'number', description: 'File size in bytes' },
        type: { type: 'string', description: 'MIME type' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB.');
    }

    try {
      const result = await this.uploadService.uploadImage(file);
      return {
        url: result.url,
        filename: result.filename,
        size: result.size,
        type: result.type
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload image: ' + error.message);
    }
  }

  @Delete('image/:filename')
  @ApiOperation({ summary: 'Delete an uploaded image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async deleteImage(@Param('filename') filename: string) {
    try {
      await this.uploadService.deleteImage(filename);
      return { message: 'Image deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete image: ' + error.message);
    }
  }
}

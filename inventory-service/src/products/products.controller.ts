import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product with SKU already exists' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createProduct(
    @Body() createProductInput: CreateProductInput,
    @Req() request: Request,
  ) {
    // User object is attached by JwtAuthGuard after successful authentication
    const user = (request as any).user;
    
    // DEBUG: Log entire user object to see what fields are available
    console.log(`🔍 DEBUG - Full user object:`, JSON.stringify(user, null, 2));
    console.log(`🔍 DEBUG - user.id: ${user?.id}`);
    console.log(`🔍 DEBUG - user.userId: ${user?.userId}`);
    console.log(`🔍 DEBUG - user.sub: ${user?.sub}`);
    console.log(`🔍 DEBUG - user._id: ${user?._id}`);
    
    // Try all possible field names
    const userId = user?.id || user?.userId || user?.sub || user?._id;
    
    // Extract token from cookies or Authorization header
    let authToken = (request as any).cookies?.access_token;
    if (!authToken) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
      }
    }

    const tokenPreview = authToken ? `${authToken.substring(0, 20)}...` : 'null';
    console.log(`🎫 ProductsController - User: ${user?.email} (ID: ${userId}), Role: ${user?.role}, Token: ${tokenPreview}`);

    return this.productsService.createProduct(createProductInput, userId, authToken);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in name, SKU, description' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean, description: 'Filter low stock products' })
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findAllProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('desc')) sortOrder: 'asc' | 'desc',
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('minPrice') minPriceStr?: string,
    @Query('maxPrice') maxPriceStr?: string,
    @Query('lowStock') lowStock?: boolean,
  ) {
    // Parse price filters properly
    const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
    const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;
    
    const filter: ProductFilterInput = {
      categoryId,
      isActive,
      search,
      minPrice: !isNaN(minPrice) ? minPrice : undefined,
      maxPrice: !isNaN(maxPrice) ? maxPrice : undefined,
      lowStock,
    };

    // Remove undefined values
    Object.keys(filter).forEach(key => {
      if (filter[key as keyof ProductFilterInput] === undefined) {
        delete filter[key as keyof ProductFilterInput];
      }
    });

    return this.productsService.findAllProducts(filter, page, limit, sortBy, sortOrder);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Product statistics retrieved successfully' })
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getProductStats() {
    return this.productsService.getProductStats();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'Low stock products retrieved successfully' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Stock threshold' })
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getLowStockProducts(@Query('threshold') threshold?: number) {
    return this.productsService.getLowStockProducts(threshold);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get product by SKU' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findProductBySku(@Param('sku') sku: string) {
    return this.productsService.findProductBySku(sku);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductInput: UpdateProductInput,
  ) {
    return this.productsService.updateProduct(id, updateProductInput);
  }

  @Put(':id/stock')
  @ApiOperation({ summary: 'Update product stock' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; operation: 'add' | 'subtract' | 'set' },
  ) {
    return this.productsService.updateStock(id, body.quantity, body.operation);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @HttpCode(HttpStatus.OK)
  // @Roles(UserRole.ADMIN)
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}

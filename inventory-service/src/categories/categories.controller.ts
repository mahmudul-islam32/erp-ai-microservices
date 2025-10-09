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
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryInput, UpdateCategoryInput, CategoryFilterInput, CategoryResponse } from './dto/category.dto';
import { Category } from './schemas/category.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@ApiTags('Categories')
@Controller('categories')
// @UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryInput })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    type: CategoryResponse,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category name or code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createCategory(
    @Body(ValidationPipe) createCategoryInput: CreateCategoryInput,
  ): Promise<Category> {
    return await this.categoriesService.createCategory(createCategoryInput);
  }

  @Get()
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all categories with pagination and filtering' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent category ID' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, description, or code' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: sortOrder)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc (default: asc)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  async findAllCategories(
    @Query('parentId') parentId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'sortOrder',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    categories: Category[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: CategoryFilterInput = {};
    // Only add parentId if it's a valid non-empty string
    if (parentId && parentId.trim() !== '') filter.parentId = parentId;
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) filter.search = search;

    return await this.categoriesService.findAllCategories(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @Get('tree')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get category tree structure' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category tree retrieved successfully',
  })
  async getCategoryTree(): Promise<any[]> {
    return await this.categoriesService.getCategoryTree();
  }

  @Get('stats')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category statistics retrieved successfully',
  })
  async getCategoryStats(): Promise<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    rootCategories: number;
  }> {
    return await this.categoriesService.getCategoryStats();
  }

  @Get('root')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get root categories (categories without parent)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Root categories retrieved successfully',
    type: [CategoryResponse],
  })
  async findRootCategories(): Promise<Category[]> {
    return await this.categoriesService.findRootCategories();
  }

  @Get(':id')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully',
    type: CategoryResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid category ID format',
  })
  async findCategoryById(@Param('id') id: string): Promise<Category> {
    return await this.categoriesService.findCategoryById(id);
  }

  @Get('code/:code')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get category by code' })
  @ApiParam({ name: 'code', description: 'Category code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully',
    type: CategoryResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findCategoryByCode(@Param('code') code: string): Promise<Category> {
    return await this.categoriesService.findCategoryByCode(code);
  }

  @Get(':id/children')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get child categories by parent ID' })
  @ApiParam({ name: 'id', description: 'Parent category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Child categories retrieved successfully',
    type: [CategoryResponse],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid parent ID format',
  })
  async findChildCategories(@Param('id') parentId: string): Promise<Category[]> {
    return await this.categoriesService.findChildCategories(parentId);
  }

  @Put(':id')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryInput })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    type: CategoryResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category name or code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or category ID format',
  })
  async updateCategory(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCategoryInput: UpdateCategoryInput,
  ): Promise<Category> {
    return await this.categoriesService.updateCategory(id, updateCategoryInput);
  }

  @Delete(':id')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete category with child categories or invalid ID format',
  })
  async deleteCategory(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return await this.categoriesService.deleteCategory(id);
  }
}

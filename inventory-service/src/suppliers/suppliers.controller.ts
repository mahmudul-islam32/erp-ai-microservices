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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierInput, UpdateSupplierInput, SupplierFilterInput } from './dto/supplier.dto';
import { Supplier } from './schemas/supplier.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@ApiTags('Suppliers')
@Controller('suppliers')
// @UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({ type: CreateSupplierInput })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Supplier created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Supplier name, code, or email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createSupplier(
    @Body(ValidationPipe) createSupplierInput: CreateSupplierInput,
  ): Promise<Supplier> {
    return await this.suppliersService.createSupplier(createSupplierInput);
  }

  @Get()
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all suppliers with pagination and filtering' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, code, email, phone, or contact person' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: name)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc (default: asc)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suppliers retrieved successfully',
  })
  async findAllSuppliers(
    @Query('isActive') isActive?: boolean,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'name',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    suppliers: Supplier[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: SupplierFilterInput = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (city) filter.city = city;
    if (country) filter.country = country;
    if (search) filter.search = search;

    return await this.suppliersService.findAllSuppliers(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @Get('stats')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get supplier statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier statistics retrieved successfully',
  })
  async getSupplierStats(): Promise<{
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    suppliersByCountry: Array<{ country: string; count: number }>;
  }> {
    return await this.suppliersService.getSupplierStats();
  }

  @Get('search')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Search suppliers' })
  @ApiQuery({ name: 'q', description: 'Search term' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
  })
  async searchSuppliers(@Query('q') searchTerm: string): Promise<Supplier[]> {
    return await this.suppliersService.searchSuppliers(searchTerm);
  }

  @Get('location')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Find suppliers by location' })
  @ApiQuery({ name: 'city', required: false, description: 'City filter' })
  @ApiQuery({ name: 'country', required: false, description: 'Country filter' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suppliers by location retrieved successfully',
  })
  async findSuppliersByLocation(
    @Query('city') city?: string,
    @Query('country') country?: string,
  ): Promise<Supplier[]> {
    return await this.suppliersService.findSuppliersByLocation(city, country);
  }

  @Get(':id')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid supplier ID format',
  })
  async findSupplierById(@Param('id') id: string): Promise<Supplier> {
    return await this.suppliersService.findSupplierById(id);
  }

  @Get('code/:code')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get supplier by code' })
  @ApiParam({ name: 'code', description: 'Supplier code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  async findSupplierByCode(@Param('code') code: string): Promise<Supplier> {
    return await this.suppliersService.findSupplierByCode(code);
  }

  @Put(':id')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiBody({ type: UpdateSupplierInput })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Supplier name, code, or email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or supplier ID format',
  })
  async updateSupplier(
    @Param('id') id: string,
    @Body(ValidationPipe) updateSupplierInput: UpdateSupplierInput,
  ): Promise<Supplier> {
    return await this.suppliersService.updateSupplier(id, updateSupplierInput);
  }

  @Delete(':id')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid supplier ID format',
  })
  async deleteSupplier(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return await this.suppliersService.deleteSupplier(id);
  }
}

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
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseInput, UpdateWarehouseInput, WarehouseFilterInput } from './dto/warehouse.dto';
import { Warehouse } from './schemas/warehouse.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@ApiTags('Warehouses')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiBody({ type: CreateWarehouseInput })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Warehouse created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Warehouse name or code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createWarehouse(
    @Body(ValidationPipe) createWarehouseInput: CreateWarehouseInput,
  ): Promise<Warehouse> {
    return await this.warehousesService.createWarehouse(createWarehouseInput);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all warehouses with pagination and filtering' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by warehouse type' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, code, description, or address' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: name)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc (default: asc)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouses retrieved successfully',
  })
  async findAllWarehouses(
    @Query('isActive') isActive?: boolean,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'name',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    warehouses: Warehouse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: WarehouseFilterInput = {};
    if (isActive !== undefined) filter.isActive = isActive;
    if (type) filter.type = type;
    if (city) filter.city = city;
    if (country) filter.country = country;
    if (search) filter.search = search;

    return await this.warehousesService.findAllWarehouses(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all active warehouses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active warehouses retrieved successfully',
  })
  async getActiveWarehouses(): Promise<Warehouse[]> {
    return await this.warehousesService.getActiveWarehouses();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get warehouse statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse statistics retrieved successfully',
  })
  async getWarehouseStats(): Promise<{
    totalWarehouses: number;
    activeWarehouses: number;
    inactiveWarehouses: number;
    warehousesByType: Array<{ type: string; count: number }>;
    warehousesByCountry: Array<{ country: string; count: number }>;
  }> {
    return await this.warehousesService.getWarehouseStats();
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Search warehouses' })
  @ApiQuery({ name: 'q', description: 'Search term' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
  })
  async searchWarehouses(@Query('q') searchTerm: string): Promise<Warehouse[]> {
    return await this.warehousesService.searchWarehouses(searchTerm);
  }

  @Get('location')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Find warehouses by location' })
  @ApiQuery({ name: 'city', required: false, description: 'City filter' })
  @ApiQuery({ name: 'country', required: false, description: 'Country filter' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouses by location retrieved successfully',
  })
  async findWarehousesByLocation(
    @Query('city') city?: string,
    @Query('country') country?: string,
  ): Promise<Warehouse[]> {
    return await this.warehousesService.findWarehousesByLocation(city, country);
  }

  @Get('type/:type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Find warehouses by type' })
  @ApiParam({ name: 'type', description: 'Warehouse type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouses by type retrieved successfully',
  })
  async findWarehousesByType(@Param('type') type: string): Promise<Warehouse[]> {
    return await this.warehousesService.findWarehousesByType(type);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get warehouse by ID' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid warehouse ID format',
  })
  async findWarehouseById(@Param('id') id: string): Promise<Warehouse> {
    return await this.warehousesService.findWarehouseById(id);
  }

  @Get('code/:code')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get warehouse by code' })
  @ApiParam({ name: 'code', description: 'Warehouse code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
  })
  async findWarehouseByCode(@Param('code') code: string): Promise<Warehouse> {
    return await this.warehousesService.findWarehouseByCode(code);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update warehouse by ID' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiBody({ type: UpdateWarehouseInput })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Warehouse name or code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or warehouse ID format',
  })
  async updateWarehouse(
    @Param('id') id: string,
    @Body(ValidationPipe) updateWarehouseInput: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    return await this.warehousesService.updateWarehouse(id, updateWarehouseInput);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete warehouse by ID' })
  @ApiParam({ name: 'id', description: 'Warehouse ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid warehouse ID format',
  })
  async deleteWarehouse(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return await this.warehousesService.deleteWarehouse(id);
  }
}

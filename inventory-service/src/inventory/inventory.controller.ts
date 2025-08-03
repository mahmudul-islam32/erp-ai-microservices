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
import { InventoryService } from './inventory.service';
import { 
  CreateInventoryInput, 
  UpdateInventoryInput, 
  CreateInventoryTransactionInput, 
  InventoryFilterInput 
} from './dto/inventory.dto';
import { Inventory, InventoryTransaction } from './schemas/inventory.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new inventory entry' })
  @ApiBody({ type: CreateInventoryInput })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inventory entry created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Inventory entry already exists for this product and warehouse',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createInventory(
    @Body(ValidationPipe) createInventoryInput: CreateInventoryInput,
  ): Promise<Inventory> {
    return await this.inventoryService.createInventory(createInventoryInput);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all inventory entries with pagination and filtering' })
  @ApiQuery({ name: 'productId', required: false, description: 'Filter by product ID' })
  @ApiQuery({ name: 'warehouseId', required: false, description: 'Filter by warehouse ID' })
  @ApiQuery({ name: 'lowStock', required: false, description: 'Filter by low stock items' })
  @ApiQuery({ name: 'outOfStock', required: false, description: 'Filter by out of stock items' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc (default: desc)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory entries retrieved successfully',
  })
  async findAllInventory(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('lowStock') lowStock?: boolean,
    @Query('outOfStock') outOfStock?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sortBy') sortBy: string = 'updatedAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{
    inventory: Inventory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: InventoryFilterInput = {};
    if (productId) filter.productId = productId;
    if (warehouseId) filter.warehouseId = warehouseId;
    if (lowStock !== undefined) filter.lowStock = lowStock;
    if (outOfStock !== undefined) filter.outOfStock = outOfStock;

    return await this.inventoryService.findAllInventory(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock items retrieved successfully',
  })
  async getLowStockItems(): Promise<Inventory[]> {
    return await this.inventoryService.getLowStockItems();
  }

  @Get('out-of-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get out of stock items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Out of stock items retrieved successfully',
  })
  async getOutOfStockItems(): Promise<Inventory[]> {
    return await this.inventoryService.getOutOfStockItems();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory statistics retrieved successfully',
  })
  async getInventoryStats(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    averageValue: number;
  }> {
    return await this.inventoryService.getInventoryStats();
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get inventory entries for a specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product inventory retrieved successfully',
  })
  async getInventoryByProduct(@Param('productId') productId: string): Promise<Inventory[]> {
    return await this.inventoryService.getInventoryByProduct(productId);
  }

  @Get('warehouse/:warehouseId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get inventory entries for a specific warehouse' })
  @ApiParam({ name: 'warehouseId', description: 'Warehouse ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse inventory retrieved successfully',
  })
  async getInventoryByWarehouse(@Param('warehouseId') warehouseId: string): Promise<Inventory[]> {
    return await this.inventoryService.getInventoryByWarehouse(warehouseId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get inventory entry by ID' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory entry retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Inventory entry not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid inventory ID format',
  })
  async findInventoryById(@Param('id') id: string): Promise<Inventory> {
    return await this.inventoryService.findInventoryById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update inventory entry by ID' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiBody({ type: UpdateInventoryInput })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory entry updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Inventory entry not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or inventory ID format',
  })
  async updateInventory(
    @Param('id') id: string,
    @Body(ValidationPipe) updateInventoryInput: UpdateInventoryInput,
  ): Promise<Inventory> {
    return await this.inventoryService.updateInventory(id, updateInventoryInput);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete inventory entry by ID' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory entry deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Inventory entry not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid inventory ID format',
  })
  async deleteInventory(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return await this.inventoryService.deleteInventory(id);
  }

  @Post('transactions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new inventory transaction' })
  @ApiBody({ type: CreateInventoryTransactionInput })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inventory transaction created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or insufficient stock',
  })
  async createInventoryTransaction(
    @Body(ValidationPipe) createTransactionInput: CreateInventoryTransactionInput,
  ): Promise<InventoryTransaction> {
    return await this.inventoryService.createInventoryTransaction(createTransactionInput);
  }

  @Get('transactions/history/:inventoryId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get inventory transaction history' })
  @ApiParam({ name: 'inventoryId', description: 'Inventory ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction history retrieved successfully',
  })
  async getTransactionHistory(
    @Param('inventoryId') inventoryId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{
    transactions: InventoryTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await this.inventoryService.getTransactionHistory(inventoryId, page, limit);
  }
}

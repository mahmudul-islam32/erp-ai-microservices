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
  BadRequestException,
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
import { Inventory, InventoryTransaction, InventoryTransactionReason } from './schemas/inventory.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@ApiTags('Inventory')
@Controller('inventory')
// @UseGuards(JwtAuthGuard, RolesGuard) // Temporarily disabled for testing
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  // // @Roles(UserRole.ADMIN, UserRole.MANAGER) // Temporarily disabled
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
  // // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER) // Temporarily disabled
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock items retrieved successfully',
  })
  async getLowStockItems(): Promise<Inventory[]> {
    return await this.inventoryService.getLowStockItems();
  }

  @Get('out-of-stock')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get out of stock items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Out of stock items retrieved successfully',
  })
  async getOutOfStockItems(): Promise<Inventory[]> {
    return await this.inventoryService.getOutOfStockItems();
  }

  @Get('stats')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER)
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
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
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
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

  @Get('transactions/product/:productId')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get transaction history for a product across all warehouses' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction history retrieved successfully',
  })
  async getTransactionHistoryByProduct(
    @Param('productId') productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<{
    transactions: InventoryTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await this.inventoryService.getTransactionHistoryByFilters(productId, undefined, page, limit);
  }

  @Post('adjust')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Adjust inventory levels for a product in a warehouse' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        warehouseId: { type: 'string' },
        quantity: { type: 'number' },
        reason: { type: 'string' },
        notes: { type: 'string' },
        performedBy: { type: 'string' }
      },
      required: ['productId', 'warehouseId', 'quantity', 'reason', 'performedBy']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory adjusted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async adjustStock(
    @Body() adjustData: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason: string;
      notes?: string;
      performedBy: string;
    }
  ): Promise<{ inventory: Inventory; transaction: InventoryTransaction }> {
    // Map string reason to enum
    const reasonEnum = adjustData.reason.toUpperCase() as keyof typeof InventoryTransactionReason;
    const mappedReason = InventoryTransactionReason[reasonEnum] || InventoryTransactionReason.ADJUSTMENT;
    
    return await this.inventoryService.adjustInventory({
      productId: adjustData.productId,
      warehouseId: adjustData.warehouseId,
      quantity: adjustData.quantity,
      reason: mappedReason,
      notes: adjustData.notes,
      performedBy: adjustData.performedBy
    });
  }

  @Post('transfer')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Transfer inventory between warehouses' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        fromWarehouseId: { type: 'string' },
        toWarehouseId: { type: 'string' },
        quantity: { type: 'number' },
        notes: { type: 'string' },
        performedBy: { type: 'string' }
      },
      required: ['productId', 'fromWarehouseId', 'toWarehouseId', 'quantity', 'performedBy']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory transferred successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or insufficient stock',
  })
  async transferStock(
    @Body() transferData: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
      notes?: string;
      performedBy: string;
    }
  ): Promise<{ fromInventory: Inventory; toInventory: Inventory; outTransaction: InventoryTransaction; inTransaction: InventoryTransaction }> {
    return await this.inventoryService.transferInventory({
      productId: transferData.productId,
      fromWarehouseId: transferData.fromWarehouseId,
      toWarehouseId: transferData.toWarehouseId,
      quantity: transferData.quantity,
      notes: transferData.notes,
      performedBy: transferData.performedBy
    });
  }

  @Post('reserve')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Reserve stock for an order' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID' },
        warehouseId: { type: 'string', description: 'Warehouse ID (optional, uses default warehouse if not specified)' },
        quantity: { type: 'number', description: 'Quantity to reserve' },
        orderId: { type: 'string', description: 'Order ID for reference' },
        notes: { type: 'string', description: 'Optional notes' }
      },
      required: ['productId', 'quantity', 'orderId']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock reserved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Insufficient stock or invalid data',
  })
  async reserveStock(
    @Body() reserveData: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      orderId: string;
      notes?: string;
    }
  ): Promise<Inventory> {
    // Use default warehouse if not specified
    const warehouseId = reserveData.warehouseId || '507f1f77bcf86cd799439011'; // Default warehouse ID
    
    return await this.inventoryService.reserveStock(
      reserveData.productId,
      warehouseId,
      reserveData.quantity
    );
  }

  @Post('release')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Release reserved stock' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID' },
        warehouseId: { type: 'string', description: 'Warehouse ID (optional)' },
        quantity: { type: 'number', description: 'Quantity to release' },
        orderId: { type: 'string', description: 'Order ID for reference' },
        notes: { type: 'string', description: 'Optional notes' }
      },
      required: ['productId', 'quantity', 'orderId']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reserved stock released successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data or insufficient reserved stock',
  })
  async releaseStock(
    @Body() releaseData: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      orderId: string;
      notes?: string;
    }
  ): Promise<Inventory> {
    // Use default warehouse if not specified
    const warehouseId = releaseData.warehouseId || '507f1f77bcf86cd799439011';
    
    return await this.inventoryService.releaseStock(
      releaseData.productId,
      warehouseId,
      releaseData.quantity
    );
  }

  @Get('verify/:productId')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  @ApiOperation({ summary: 'Verify inventory and product stock data for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock data retrieved successfully',
  })
  async verifyProductStock(@Param('productId') productId: string): Promise<{
    product: any;
    inventory: Inventory[];
    totalInventory: {
      totalQuantity: number;
      reservedQuantity: number;
      availableQuantity: number;
    };
    isConsistent: boolean;
    message: string;
  }> {
    // Get product data
    const product = await this.inventoryService['productModel'].findById(productId).exec();
    
    // Get all inventory records for this product
    const inventory = await this.inventoryService.getInventoryByProduct(productId);
    
    // Calculate totals from inventory
    const totalInventory = inventory.reduce((acc, inv) => ({
      totalQuantity: acc.totalQuantity + inv.quantity,
      reservedQuantity: acc.reservedQuantity + inv.reservedQuantity,
      availableQuantity: acc.availableQuantity + inv.availableQuantity,
    }), { totalQuantity: 0, reservedQuantity: 0, availableQuantity: 0 });
    
    // Check if product totals match inventory totals
    const isConsistent = product && 
      product.totalQuantity === totalInventory.totalQuantity &&
      product.reservedQuantity === totalInventory.reservedQuantity &&
      product.availableQuantity === totalInventory.availableQuantity;
    
    let message = '';
    if (!product) {
      message = 'Product not found';
    } else if (inventory.length === 0) {
      message = '⚠️  No inventory records found for this product. Create inventory records first!';
    } else if (!isConsistent) {
      message = '⚠️  Product totals DO NOT match inventory totals. Recalculation may be needed.';
    } else {
      message = '✅ Product and inventory data are consistent!';
    }
    
    return {
      product: product ? {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        totalQuantity: product.totalQuantity,
        reservedQuantity: product.reservedQuantity,
        availableQuantity: product.availableQuantity,
      } : null,
      inventory,
      totalInventory,
      isConsistent,
      message
    };
  }

  @Post('fulfill')
  // @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Fulfill stock (reduce quantity directly from available stock)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID' },
        warehouseId: { type: 'string', description: 'Warehouse ID (optional)' },
        quantity: { type: 'number', description: 'Quantity to fulfill' },
        orderId: { type: 'string', description: 'Order ID for reference' },
        notes: { type: 'string', description: 'Optional notes' },
        performedBy: { type: 'string', description: 'User ID who fulfilled the order' }
      },
      required: ['productId', 'quantity', 'orderId', 'performedBy']
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock fulfilled successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data or insufficient stock',
  })
  async fulfillStock(
    @Body() fulfillData: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      orderId: string;
      notes?: string;
      performedBy: string;
    }
  ): Promise<{ inventory: Inventory; transaction: InventoryTransaction; success: boolean; message: string }> {
    try {
      let warehouseId = fulfillData.warehouseId;
      
      // If no warehouse specified, find the first warehouse with stock for this product
      if (!warehouseId) {
        console.log(`🔍 No warehouse specified, searching for product ${fulfillData.productId} inventory...`);
        const inventoryRecords = await this.inventoryService.getInventoryByProduct(fulfillData.productId);
        
        if (inventoryRecords.length === 0) {
          throw new BadRequestException(
            `No inventory records found for product ${fulfillData.productId}. Please create inventory record first.`
          );
        }
        
        // Find warehouse with sufficient available stock
        const suitableWarehouse = inventoryRecords.find(inv => inv.availableQuantity >= fulfillData.quantity);
        
        if (!suitableWarehouse) {
          throw new BadRequestException(
            `Insufficient stock for product ${fulfillData.productId}. Required: ${fulfillData.quantity}, Available: ${inventoryRecords.reduce((sum, inv) => sum + inv.availableQuantity, 0)}`
          );
        }
        
        // Extract warehouse ID properly (could be ObjectId or populated object)
        if (typeof suitableWarehouse.warehouseId === 'object' && suitableWarehouse.warehouseId._id) {
          warehouseId = suitableWarehouse.warehouseId._id.toString();
        } else {
          warehouseId = suitableWarehouse.warehouseId.toString();
        }
        
        console.log(`✅ Found inventory in warehouse ${warehouseId} with ${suitableWarehouse.availableQuantity} available`);
      }
      
      // Reduce the stock directly via adjustment (negative quantity)
      const result = await this.inventoryService.adjustInventory({
        productId: fulfillData.productId,
        warehouseId: warehouseId,
        quantity: -fulfillData.quantity, // Negative to reduce
        reason: InventoryTransactionReason.SALE,
        notes: fulfillData.notes || `Stock fulfilled for order ${fulfillData.orderId}`,
        performedBy: fulfillData.performedBy
      });
      
      return {
        ...result,
        success: true,
        message: 'Stock fulfilled successfully'
      };
    } catch (error) {
      console.error(`❌ Error fulfilling stock:`, error.message);
      throw error;
    }
  }
}

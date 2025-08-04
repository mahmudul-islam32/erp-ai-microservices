import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Inventory, 
  InventoryDocument, 
  InventoryTransaction, 
  InventoryTransactionType,
  InventoryTransactionReason 
} from './schemas/inventory.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Warehouse, WarehouseDocument } from '../warehouses/schemas/warehouse.schema';

export interface InventoryAdjustmentInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: InventoryTransactionReason;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  performedBy: string;
}

export interface InventoryTransferInput {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  performedBy: string;
}

export interface StockMovementInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  type: InventoryTransactionType;
  reason: InventoryTransactionReason;
  unitCost: number;
  reference?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  performedBy: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransaction>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>,
  ) {}

  async getInventoryByProduct(productId: string): Promise<Inventory[]> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }

    return await this.inventoryModel
      .find({ productId: new Types.ObjectId(productId) })
      .populate('productId')
      .populate('warehouseId')
      .exec();
  }

  async getInventoryByWarehouse(warehouseId: string): Promise<Inventory[]> {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new BadRequestException('Invalid warehouse ID format');
    }

    return await this.inventoryModel
      .find({ warehouseId: new Types.ObjectId(warehouseId) })
      .populate('productId')
      .populate('warehouseId')
      .exec();
  }

  async getInventoryRecord(productId: string, warehouseId: string): Promise<InventoryDocument | null> {
    if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(warehouseId)) {
      throw new BadRequestException('Invalid ID format');
    }

    return await this.inventoryModel
      .findOne({
        productId: new Types.ObjectId(productId),
        warehouseId: new Types.ObjectId(warehouseId),
      })
      .populate('productId')
      .populate('warehouseId')
      .exec();
  }

  async getAllInventory(
    page: number = 1,
    limit: number = 10,
    filters?: any
  ): Promise<{ inventory: Inventory[], total: number, page: number, totalPages: number }> {
    const query: any = {};

    // Apply filters
    if (filters?.productId) {
      query.productId = new Types.ObjectId(filters.productId);
    }
    if (filters?.warehouseId) {
      query.warehouseId = new Types.ObjectId(filters.warehouseId);
    }
    if (filters?.lowStock) {
      // This would require joining with products to compare against reorder points
      // For now, we'll filter by quantity less than 10
      query.availableQuantity = { $lt: 10 };
    }

    const skip = (page - 1) * limit;

    const [inventory, total] = await Promise.all([
      this.inventoryModel
        .find(query)
        .populate('productId')
        .populate('warehouseId')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.inventoryModel.countDocuments(query),
    ]);

    return {
      inventory,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async recordStockMovement(input: StockMovementInput): Promise<{ inventory: InventoryDocument, transaction: InventoryTransaction }> {
    // Validate product and warehouse exist
    const [product, warehouse] = await Promise.all([
      this.productModel.findById(input.productId),
      this.warehouseModel.findById(input.warehouseId),
    ]);

    if (!product) {
      throw new NotFoundException(`Product with ID ${input.productId} not found`);
    }
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${input.warehouseId} not found`);
    }

    // Get or create inventory record
    let inventory: InventoryDocument;
    const existingInventory = await this.getInventoryRecord(input.productId, input.warehouseId);
    
    if (!existingInventory) {
      inventory = new this.inventoryModel({
        productId: new Types.ObjectId(input.productId),
        warehouseId: new Types.ObjectId(input.warehouseId),
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        averageCost: 0,
        batchNumber: input.batchNumber,
        serialNumber: input.serialNumber,
      });
    } else {
      inventory = existingInventory;
    }

    // Calculate new quantities
    let newQuantity = inventory.quantity;
    if (input.type === InventoryTransactionType.IN) {
      newQuantity += input.quantity;
    } else if (input.type === InventoryTransactionType.OUT) {
      if (inventory.availableQuantity < input.quantity) {
        throw new BadRequestException('Insufficient available stock');
      }
      newQuantity -= input.quantity;
    } else if (input.type === InventoryTransactionType.ADJUSTMENT) {
      // For adjustments, the quantity can be positive or negative
      newQuantity = input.quantity;
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    // Update average cost for inbound movements
    let newAverageCost = inventory.averageCost;
    if (input.type === InventoryTransactionType.IN && input.quantity > 0) {
      const totalValue = (inventory.quantity * inventory.averageCost) + (input.quantity * input.unitCost);
      const totalQuantity = inventory.quantity + input.quantity;
      newAverageCost = totalQuantity > 0 ? totalValue / totalQuantity : input.unitCost;
    }

    // Update inventory
    inventory.quantity = newQuantity;
    inventory.availableQuantity = newQuantity - inventory.reservedQuantity;
    inventory.averageCost = newAverageCost;
    if (input.batchNumber) inventory.batchNumber = input.batchNumber;
    if (input.serialNumber) inventory.serialNumber = input.serialNumber;

    // Create transaction record
    const transaction = new this.transactionModel({
      productId: new Types.ObjectId(input.productId),
      warehouseId: new Types.ObjectId(input.warehouseId),
      type: input.type,
      reason: input.reason,
      quantity: input.type === InventoryTransactionType.OUT ? -input.quantity : input.quantity,
      unitCost: input.unitCost,
      totalCost: input.quantity * input.unitCost,
      balanceAfter: newQuantity,
      reference: input.reference,
      batchNumber: input.batchNumber,
      serialNumber: input.serialNumber,
      notes: input.notes,
      performedBy: input.performedBy,
    });

    // Save both records
    const [savedInventory, savedTransaction] = await Promise.all([
      inventory.save(),
      transaction.save(),
    ]);

    return {
      inventory: savedInventory,
      transaction: savedTransaction,
    };
  }

  async adjustInventory(input: InventoryAdjustmentInput): Promise<{ inventory: Inventory, transaction: InventoryTransaction }> {
    const stockMovement: StockMovementInput = {
      ...input,
      type: InventoryTransactionType.ADJUSTMENT,
      unitCost: 0, // Adjustments typically don't affect cost
    };

    return await this.recordStockMovement(stockMovement);
  }

  async transferInventory(input: InventoryTransferInput): Promise<{
    fromInventory: Inventory,
    toInventory: Inventory,
    outTransaction: InventoryTransaction,
    inTransaction: InventoryTransaction,
  }> {
    // Check if source has enough stock
    const fromInventory = await this.getInventoryRecord(input.productId, input.fromWarehouseId);
    if (!fromInventory || fromInventory.availableQuantity < input.quantity) {
      throw new BadRequestException('Insufficient stock in source warehouse');
    }

    // Record outbound movement
    const outResult = await this.recordStockMovement({
      productId: input.productId,
      warehouseId: input.fromWarehouseId,
      quantity: input.quantity,
      type: InventoryTransactionType.OUT,
      reason: InventoryTransactionReason.TRANSFER_OUT,
      unitCost: fromInventory.averageCost,
      notes: input.notes,
      batchNumber: input.batchNumber,
      serialNumber: input.serialNumber,
      performedBy: input.performedBy,
      reference: `TRANSFER-${Date.now()}`,
    });

    // Record inbound movement
    const inResult = await this.recordStockMovement({
      productId: input.productId,
      warehouseId: input.toWarehouseId,
      quantity: input.quantity,
      type: InventoryTransactionType.IN,
      reason: InventoryTransactionReason.TRANSFER_IN,
      unitCost: fromInventory.averageCost,
      notes: input.notes,
      batchNumber: input.batchNumber,
      serialNumber: input.serialNumber,
      performedBy: input.performedBy,
      reference: `TRANSFER-${Date.now()}`,
    });

    return {
      fromInventory: outResult.inventory,
      toInventory: inResult.inventory,
      outTransaction: outResult.transaction,
      inTransaction: inResult.transaction,
    };
  }

  async reserveStock(productId: string, warehouseId: string, quantity: number): Promise<InventoryDocument> {
    const inventory = await this.getInventoryRecord(productId, warehouseId);
    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }

    if (inventory.availableQuantity < quantity) {
      throw new BadRequestException('Insufficient available stock for reservation');
    }

    inventory.reservedQuantity += quantity;
    inventory.availableQuantity -= quantity;

    return await inventory.save();
  }

  async releaseReservedStock(productId: string, warehouseId: string, quantity: number): Promise<InventoryDocument> {
    const inventory = await this.getInventoryRecord(productId, warehouseId);
    if (!inventory) {
      throw new NotFoundException('Inventory record not found');
    }

    if (inventory.reservedQuantity < quantity) {
      throw new BadRequestException('Cannot release more stock than reserved');
    }

    inventory.reservedQuantity -= quantity;
    inventory.availableQuantity += quantity;

    return await inventory.save();
  }

  // Method for getting transaction history by inventory ID (used by controller)
  async getTransactionHistory(
    inventoryId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: InventoryTransaction[], total: number, page: number, totalPages: number }> {
    // Get the inventory record to find productId and warehouseId
    if (!Types.ObjectId.isValid(inventoryId)) {
      throw new BadRequestException('Invalid inventory ID format');
    }

    const inventory = await this.inventoryModel.findById(inventoryId).exec();
    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);
    }

    return await this.getTransactionHistoryByFilters(
      inventory.productId.toString(),
      inventory.warehouseId.toString(),
      page,
      limit
    );
  }

  // Method for getting transaction history by product/warehouse filters
  async getTransactionHistoryByFilters(
    productId?: string,
    warehouseId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transactions: InventoryTransaction[], total: number, page: number, totalPages: number }> {
    const query: any = {};

    if (productId && Types.ObjectId.isValid(productId)) {
      query.productId = new Types.ObjectId(productId);
    }
    if (warehouseId && Types.ObjectId.isValid(warehouseId)) {
      query.warehouseId = new Types.ObjectId(warehouseId);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .populate('productId')
        .populate('warehouseId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(query),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLowStockItems(warehouseId?: string): Promise<any[]> {
    const matchStage: any = {};
    if (warehouseId && Types.ObjectId.isValid(warehouseId)) {
      matchStage.warehouseId = new Types.ObjectId(warehouseId);
    }

    return await this.inventoryModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $match: {
          $expr: { $lte: ['$availableQuantity', '$product.reorderPoint'] }
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouseId',
          foreignField: '_id',
          as: 'warehouse'
        }
      },
      { $unwind: '$warehouse' },
      {
        $project: {
          productId: 1,
          warehouseId: 1,
          availableQuantity: 1,
          product: 1,
          warehouse: 1,
          deficit: { $subtract: ['$product.reorderPoint', '$availableQuantity'] }
        }
      },
      { $sort: { deficit: -1 } }
    ]);
  }

  async getInventoryStats(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    averageValue: number;
  }> {
    const [inventoryStats, lowStockCount, outOfStockCount] = await Promise.all([
      this.inventoryModel.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: null,
            totalItems: { $sum: '$quantity' },
            totalValue: {
              $sum: { $multiply: ['$quantity', '$averageCost'] }
            },
            itemCount: { $sum: 1 }
          }
        }
      ]),
      this.getLowStockItems(),
      this.getOutOfStockItems()
    ]);

    const stats = inventoryStats[0] || {
      totalItems: 0,
      totalValue: 0,
      itemCount: 0
    };

    return {
      totalItems: stats.totalItems,
      lowStockItems: lowStockCount.length,
      outOfStockItems: outOfStockCount.length,
      totalValue: stats.totalValue,
      averageValue: stats.itemCount > 0 ? stats.totalValue / stats.itemCount : 0,
    };
  }

  // Additional methods required by controller and resolver
  async createInventory(createInventoryInput: any): Promise<Inventory> {
    const existingInventory = await this.getInventoryRecord(
      createInventoryInput.productId,
      createInventoryInput.warehouseId
    );

    if (existingInventory) {
      throw new ConflictException('Inventory entry already exists for this product and warehouse');
    }

    const newInventory = new this.inventoryModel({
      productId: new Types.ObjectId(createInventoryInput.productId),
      warehouseId: new Types.ObjectId(createInventoryInput.warehouseId),
      currentStock: createInventoryInput.currentStock || 0,
      reservedStock: createInventoryInput.reservedStock || 0,
      availableStock: createInventoryInput.availableStock || createInventoryInput.currentStock || 0,
      lastUpdatedBy: createInventoryInput.lastUpdatedBy || 'system',
    });

    return await newInventory.save();
  }

  async findAllInventory(
    filter?: any,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'updatedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ inventory: Inventory[], total: number, page: number, totalPages: number }> {
    const query: any = {};

    if (filter) {
      if (filter.productId) {
        query.productId = new Types.ObjectId(filter.productId);
      }
      if (filter.warehouseId) {
        query.warehouseId = new Types.ObjectId(filter.warehouseId);
      }
      if (filter.lowStock) {
        // Join with product to get min stock level
        query.$expr = { $lt: ['$currentStock', '$minStockLevel'] };
      }
      if (filter.outOfStock) {
        query.currentStock = { $lte: 0 };
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [inventory, total] = await Promise.all([
      this.inventoryModel
        .find(query)
        .populate('productId')
        .populate('warehouseId')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.inventoryModel.countDocuments(query),
    ]);

    return {
      inventory,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOutOfStockItems(): Promise<Inventory[]> {
    return await this.inventoryModel
      .find({ currentStock: { $lte: 0 } })
      .populate('productId')
      .populate('warehouseId')
      .exec();
  }

  async findInventoryById(id: string): Promise<Inventory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid inventory ID format');
    }

    const inventory = await this.inventoryModel
      .findById(id)
      .populate('productId')
      .populate('warehouseId')
      .exec();

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async updateInventory(id: string, updateInventoryInput: any): Promise<Inventory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid inventory ID format');
    }

    const updatedInventory = await this.inventoryModel
      .findByIdAndUpdate(id, updateInventoryInput, { new: true, runValidators: true })
      .populate('productId')
      .populate('warehouseId')
      .exec();

    if (!updatedInventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return updatedInventory;
  }

  async deleteInventory(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid inventory ID format');
    }

    const result = await this.inventoryModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Inventory deleted successfully',
    };
  }

  async createInventoryTransaction(createTransactionInput: any): Promise<InventoryTransaction> {
    const stockMovementInput: StockMovementInput = {
      productId: createTransactionInput.productId,
      warehouseId: createTransactionInput.warehouseId,
      quantity: createTransactionInput.quantity,
      type: createTransactionInput.type,
      reason: createTransactionInput.reason,
      unitCost: createTransactionInput.unitCost || 0,
      reference: createTransactionInput.reference,
      notes: createTransactionInput.notes,
      performedBy: createTransactionInput.performedBy || 'system',
    };

    const result = await this.recordStockMovement(stockMovementInput);
    return result.transaction;
  }
}

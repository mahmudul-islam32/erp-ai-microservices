import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Inventory, InventoryTransaction } from './schemas/inventory.schema';
import { 
  CreateInventoryInput, 
  UpdateInventoryInput, 
  CreateInventoryTransactionInput, 
  InventoryFilterInput 
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@Resolver(() => Inventory)
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryResolver {
  constructor(private readonly inventoryService: InventoryService) {}

  @Mutation(() => Inventory)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createInventory(
    @Args('createInventoryInput') createInventoryInput: CreateInventoryInput,
  ): Promise<Inventory> {
    return await this.inventoryService.createInventory(createInventoryInput);
  }

  @Query(() => [Inventory])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async inventory(
    @Args('filter', { nullable: true }) filter?: InventoryFilterInput,
    @Args('page', { defaultValue: 1 }) page: number = 1,
    @Args('limit', { defaultValue: 10 }) limit: number = 10,
    @Args('sortBy', { defaultValue: 'updatedAt' }) sortBy: string = 'updatedAt',
    @Args('sortOrder', { defaultValue: 'desc' }) sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<Inventory[]> {
    const result = await this.inventoryService.findAllInventory(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
    return result.inventory;
  }

  @Query(() => [Inventory])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async lowStockItems(): Promise<Inventory[]> {
    return await this.inventoryService.getLowStockItems();
  }

  @Query(() => [Inventory])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async outOfStockItems(): Promise<Inventory[]> {
    return await this.inventoryService.getOutOfStockItems();
  }

  @Query(() => [Inventory])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async inventoryByProduct(
    @Args('productId', { type: () => ID }) productId: string,
  ): Promise<Inventory[]> {
    return await this.inventoryService.getInventoryByProduct(productId);
  }

  @Query(() => [Inventory])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async inventoryByWarehouse(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
  ): Promise<Inventory[]> {
    return await this.inventoryService.getInventoryByWarehouse(warehouseId);
  }

  @Query(() => Inventory)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async inventoryItem(@Args('id', { type: () => ID }) id: string): Promise<Inventory> {
    return await this.inventoryService.findInventoryById(id);
  }

  @Mutation(() => Inventory)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateInventory(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateInventoryInput') updateInventoryInput: UpdateInventoryInput,
  ): Promise<Inventory> {
    return await this.inventoryService.updateInventory(id, updateInventoryInput);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteInventory(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.inventoryService.deleteInventory(id);
    return result.success;
  }

  @Mutation(() => InventoryTransaction)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async createInventoryTransaction(
    @Args('createTransactionInput') createTransactionInput: CreateInventoryTransactionInput,
  ): Promise<InventoryTransaction> {
    return await this.inventoryService.createInventoryTransaction(createTransactionInput);
  }

  @Query(() => [InventoryTransaction])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async transactionHistory(
    @Args('productId', { type: () => ID, nullable: true }) productId?: string,
    @Args('warehouseId', { type: () => ID, nullable: true }) warehouseId?: string,
    @Args('page', { defaultValue: 1 }) page: number = 1,
    @Args('limit', { defaultValue: 10 }) limit: number = 10,
  ): Promise<InventoryTransaction[]> {
        const result = await this.inventoryService.getTransactionHistoryByFilters(productId, warehouseId, page, limit);
    return result.transactions;
  }
}

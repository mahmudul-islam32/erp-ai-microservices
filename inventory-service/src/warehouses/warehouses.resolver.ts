import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from './schemas/warehouse.schema';
import { CreateWarehouseInput, UpdateWarehouseInput, WarehouseFilterInput } from './dto/warehouse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@Resolver(() => Warehouse)
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesResolver {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Mutation(() => Warehouse)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createWarehouse(
    @Args('createWarehouseInput') createWarehouseInput: CreateWarehouseInput,
  ): Promise<Warehouse> {
    return await this.warehousesService.createWarehouse(createWarehouseInput);
  }

  @Query(() => [Warehouse])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async warehouses(
    @Args('filter', { nullable: true }) filter?: WarehouseFilterInput,
    @Args('page', { defaultValue: 1 }) page: number = 1,
    @Args('limit', { defaultValue: 10 }) limit: number = 10,
    @Args('sortBy', { defaultValue: 'name' }) sortBy: string = 'name',
    @Args('sortOrder', { defaultValue: 'asc' }) sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<Warehouse[]> {
    const result = await this.warehousesService.findAllWarehouses(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
    return result.warehouses;
  }

  @Query(() => [Warehouse])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async activeWarehouses(): Promise<Warehouse[]> {
    return await this.warehousesService.getActiveWarehouses();
  }

  @Query(() => Warehouse)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async warehouse(@Args('id', { type: () => ID }) id: string): Promise<Warehouse> {
    return await this.warehousesService.findWarehouseById(id);
  }

  @Query(() => Warehouse)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async warehouseByCode(@Args('code') code: string): Promise<Warehouse> {
    return await this.warehousesService.findWarehouseByCode(code);
  }

  @Query(() => [Warehouse])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async searchWarehouses(@Args('searchTerm') searchTerm: string): Promise<Warehouse[]> {
    return await this.warehousesService.searchWarehouses(searchTerm);
  }

  @Query(() => [Warehouse])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async warehousesByLocation(
    @Args('city', { nullable: true }) city?: string,
    @Args('country', { nullable: true }) country?: string,
  ): Promise<Warehouse[]> {
    return await this.warehousesService.findWarehousesByLocation(city, country);
  }

  @Query(() => [Warehouse])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async warehousesByType(@Args('type') type: string): Promise<Warehouse[]> {
    return await this.warehousesService.findWarehousesByType(type);
  }

  @Mutation(() => Warehouse)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateWarehouse(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateWarehouseInput') updateWarehouseInput: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    return await this.warehousesService.updateWarehouse(id, updateWarehouseInput);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteWarehouse(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.warehousesService.deleteWarehouse(id);
    return result.success;
  }
}

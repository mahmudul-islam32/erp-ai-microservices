import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './schemas/supplier.schema';
import { CreateSupplierInput, UpdateSupplierInput, SupplierFilterInput } from './dto/supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@Resolver(() => Supplier)
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersResolver {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Mutation(() => Supplier)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createSupplier(
    @Args('createSupplierInput') createSupplierInput: CreateSupplierInput,
  ): Promise<Supplier> {
    return await this.suppliersService.createSupplier(createSupplierInput);
  }

  @Query(() => [Supplier])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async suppliers(
    @Args('filter', { nullable: true }) filter?: SupplierFilterInput,
    @Args('page', { defaultValue: 1 }) page: number = 1,
    @Args('limit', { defaultValue: 10 }) limit: number = 10,
    @Args('sortBy', { defaultValue: 'name' }) sortBy: string = 'name',
    @Args('sortOrder', { defaultValue: 'asc' }) sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<Supplier[]> {
    const result = await this.suppliersService.findAllSuppliers(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
    return result.suppliers;
  }

  @Query(() => Supplier)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async supplier(@Args('id', { type: () => ID }) id: string): Promise<Supplier> {
    return await this.suppliersService.findSupplierById(id);
  }

  @Query(() => Supplier)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async supplierByCode(@Args('code') code: string): Promise<Supplier> {
    return await this.suppliersService.findSupplierByCode(code);
  }

  @Query(() => [Supplier])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async searchSuppliers(@Args('searchTerm') searchTerm: string): Promise<Supplier[]> {
    return await this.suppliersService.searchSuppliers(searchTerm);
  }

  @Query(() => [Supplier])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async suppliersByLocation(
    @Args('city', { nullable: true }) city?: string,
    @Args('country', { nullable: true }) country?: string,
  ): Promise<Supplier[]> {
    return await this.suppliersService.findSuppliersByLocation(city, country);
  }

  @Mutation(() => Supplier)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateSupplier(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateSupplierInput') updateSupplierInput: UpdateSupplierInput,
  ): Promise<Supplier> {
    return await this.suppliersService.updateSupplier(id, updateSupplierInput);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteSupplier(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.suppliersService.deleteSupplier(id);
    return result.success;
  }
}

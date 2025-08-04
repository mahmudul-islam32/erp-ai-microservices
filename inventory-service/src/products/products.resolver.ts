import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';

@Resolver(() => Product)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Mutation(() => Product)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ): Promise<Product> {
    return this.productsService.createProduct(createProductInput);
  }

  @Query(() => [Product], { name: 'products' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findAllProducts(
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit?: number,
    @Args('sortBy', { defaultValue: 'createdAt' }) sortBy?: string,
    @Args('sortOrder', { defaultValue: 'desc' }) sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.productsService.findAllProducts(filter, page, limit, sortBy, sortOrder);
    return result.products;
  }

  @Query(() => Product, { name: 'product' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findProductById(@Args('id', { type: () => ID }) id: string): Promise<Product> {
    return this.productsService.findProductById(id);
  }

  @Query(() => Product, { name: 'productBySku' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async findProductBySku(@Args('sku') sku: string): Promise<Product> {
    return this.productsService.findProductBySku(sku);
  }

  @Mutation(() => Product)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateProduct(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ): Promise<Product> {
    return this.productsService.updateProduct(id, updateProductInput);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN)
  async deleteProduct(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.productsService.deleteProduct(id);
    return result.success;
  }

  @Mutation(() => Product)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async updateStock(
    @Args('id', { type: () => ID }) id: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @Args('operation') operation: 'add' | 'subtract' | 'set',
  ): Promise<Product> {
    return this.productsService.updateStock(id, quantity, operation);
  }

  @Query(() => [Product], { name: 'lowStockProducts' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  async getLowStockProducts(
    @Args('threshold', { type: () => Int, nullable: true }) threshold?: number,
  ): Promise<Product[]> {
    return this.productsService.getLowStockProducts(threshold);
  }
}

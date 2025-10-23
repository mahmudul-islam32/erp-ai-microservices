import { Resolver, Query, Mutation, Args, ID, Int, Context } from '@nestjs/graphql';
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
    @Context() context: any,
  ): Promise<Product> {
    // User object is attached by JwtAuthGuard
    // AuthService.validateToken() returns a User object with field "id" (not userId or sub)
    const user = context.req?.user;
    const userId = user?.id;  // ✅ FIXED: Use "id" field from AuthService response
    
    // Extract token from cookies or Authorization header
    let authToken = context.req?.cookies?.access_token;
    if (!authToken) {
      const authHeader = context.req?.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.substring(7);
      }
    }

    console.log(`🎫 GraphQL createProduct - User: ${user?.email} (ID: ${userId}), Token present: ${!!authToken}`);

    return this.productsService.createProduct(createProductInput, userId, authToken);
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

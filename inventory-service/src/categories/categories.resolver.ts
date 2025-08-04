import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './schemas/category.schema';
import { CreateCategoryInput, UpdateCategoryInput, CategoryFilterInput } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/auth.service';

@Resolver(() => Category)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Mutation(() => Category)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
  ): Promise<Category> {
    return await this.categoriesService.createCategory(createCategoryInput);
  }

  @Query(() => [Category])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async categories(
    @Args('filter', { nullable: true }) filter?: CategoryFilterInput,
    @Args('page', { defaultValue: 1 }) page: number = 1,
    @Args('limit', { defaultValue: 10 }) limit: number = 10,
    @Args('sortBy', { defaultValue: 'sortOrder' }) sortBy: string = 'sortOrder',
    @Args('sortOrder', { defaultValue: 'asc' }) sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<Category[]> {
    const result = await this.categoriesService.findAllCategories(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
    return result.categories;
  }

  @Query(() => Category)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async category(@Args('id', { type: () => ID }) id: string): Promise<Category> {
    return await this.categoriesService.findCategoryById(id);
  }

  @Query(() => Category)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async categoryByCode(@Args('code') code: string): Promise<Category> {
    return await this.categoriesService.findCategoryByCode(code);
  }

  @Query(() => [Category])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async rootCategories(): Promise<Category[]> {
    return await this.categoriesService.findRootCategories();
  }

  @Query(() => [Category])
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  async childCategories(
    @Args('parentId', { type: () => ID }) parentId: string,
  ): Promise<Category[]> {
    return await this.categoriesService.findChildCategories(parentId);
  }

  @Mutation(() => Category)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
  ): Promise<Category> {
    return await this.categoriesService.updateCategory(id, updateCategoryInput);
  }

  @Mutation(() => Boolean)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deleteCategory(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.categoriesService.deleteCategory(id);
    return result.success;
  }
}

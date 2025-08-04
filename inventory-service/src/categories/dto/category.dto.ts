import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class CreateCategoryInput {
  @Field()
  @ApiProperty({ description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Category code' })
  @IsString()
  @IsOptional()
  code?: string;

  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Category image URL' })
  @IsString()
  @IsOptional()
  image?: string;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ description: 'Category tags' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @Field({ defaultValue: true })
  @ApiPropertyOptional({ description: 'Whether category is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ defaultValue: 0 })
  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

@InputType()
export class UpdateCategoryInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Category name' })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Category code' })
  @IsString()
  @IsOptional()
  code?: string;

  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Category image URL' })
  @IsString()
  @IsOptional()
  image?: string;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ description: 'Category tags' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Whether category is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Sort order' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

@InputType()
export class CategoryFilterInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by parent category ID' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsString()
  @IsOptional()
  search?: string;
}

@ObjectType()
export class CategoryResponse {
  @Field(() => ID)
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @Field()
  @ApiProperty({ description: 'Category name' })
  name: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Category description' })
  description?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Category code' })
  code?: string;

  @Field(() => ID, { nullable: true })
  @ApiProperty({ description: 'Parent category ID' })
  parentId?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Category image URL' })
  image?: string;

  @Field(() => [String], { nullable: true })
  @ApiProperty({ description: 'Category tags' })
  tags?: string[];

  @Field()
  @ApiProperty({ description: 'Whether category is active' })
  isActive: boolean;

  @Field()
  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @Field()
  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @Field()
  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}

@ObjectType()
export class PaginatedCategoriesResponse {
  @Field(() => [CategoryResponse])
  @ApiProperty({ description: 'List of categories' })
  categories: CategoryResponse[];

  @Field()
  @ApiProperty({ description: 'Total number of categories' })
  total: number;

  @Field()
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @Field()
  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

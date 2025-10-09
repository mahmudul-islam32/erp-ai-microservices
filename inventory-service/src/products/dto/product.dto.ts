import { InputType, Field, Float, Int, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

@InputType()
export class CreateProductInput {
  @Field()
  @ApiProperty({ description: 'Product SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @Field()
  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => ID)
  @ApiProperty({ description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @Field(() => Float)
  @ApiProperty({ description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Float)
  @ApiProperty({ description: 'Product cost' })
  @IsNumber()
  @Min(0)
  cost: number;

  @Field()
  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Current stock quantity (optional, managed by inventory service)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Minimum stock level', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockLevel?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Maximum stock level', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStockLevel?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Reorder point', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Reorder quantity', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product barcode' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ description: 'Product images URLs' })
  @IsArray()
  @IsOptional()
  images?: string[];

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ description: 'Product weight' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product dimensions' })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @Field(() => [ID], { nullable: true })
  @ApiPropertyOptional({ description: 'Supplier IDs' })
  @IsArray()
  @IsOptional()
  supplierIds?: string[];

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product tags' })
  @IsString()
  @IsOptional()
  tags?: string;

  @Field({ defaultValue: true })
  @ApiPropertyOptional({ description: 'Whether product is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ defaultValue: false })
  @ApiPropertyOptional({ description: 'Whether product is trackable', default: false })
  @IsBoolean()
  @IsOptional()
  isTrackable?: boolean;
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsString()
  @IsOptional()
  sku?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product name' })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ description: 'Product price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ description: 'Product cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Current stock quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Minimum stock level' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockLevel?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Maximum stock level' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStockLevel?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Reorder point' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ description: 'Reorder quantity' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product barcode' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @Field(() => [String], { nullable: true })
  @ApiPropertyOptional({ description: 'Product images URLs' })
  @IsArray()
  @IsOptional()
  images?: string[];

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ description: 'Product weight' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product dimensions' })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @Field(() => [ID], { nullable: true })
  @ApiPropertyOptional({ description: 'Supplier IDs' })
  @IsArray()
  @IsOptional()
  supplierIds?: string[];

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Product tags' })
  @IsString()
  @IsOptional()
  tags?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Whether product is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Whether product is trackable' })
  @IsBoolean()
  @IsOptional()
  isTrackable?: boolean;
}

@InputType()
export class ProductFilterInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Search by name or SKU' })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by low stock (below reorder point)' })
  @IsBoolean()
  @IsOptional()
  lowStock?: boolean;
}

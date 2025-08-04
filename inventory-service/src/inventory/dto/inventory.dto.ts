import { InputType, Field, ObjectType, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsNumber, MinLength, MaxLength, IsEmail, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@InputType()
export class CreateInventoryInput {
  @Field()
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @MinLength(1)
  productId: string;

  @Field()
  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  @MinLength(1)
  warehouseId: string;

  @Field()
  @ApiProperty({ description: 'Current stock quantity' })
  @IsNumber()
  currentStock: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Reserved stock quantity' })
  @IsOptional()
  @IsNumber()
  reservedStock?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Available stock quantity' })
  @IsOptional()
  @IsNumber()
  availableStock?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Last updated by user' })
  @IsOptional()
  @IsString()
  lastUpdatedBy?: string;
}

@InputType()
export class UpdateInventoryInput extends PartialType(CreateInventoryInput) {}

@InputType()
export class InventoryFilterInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by minimum stock level' })
  @IsOptional()
  @IsNumber()
  minStock?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by maximum stock level' })
  @IsOptional()
  @IsNumber()
  maxStock?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by low stock items' })
  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by out of stock items' })
  @IsOptional()
  @IsBoolean()
  outOfStock?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;
}

@InputType()
export class CreateInventoryTransactionInput {
  @Field()
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @MinLength(1)
  productId: string;

  @Field()
  @ApiProperty({ description: 'Warehouse ID' })
  @IsString()
  @MinLength(1)
  warehouseId: string;

  @Field()
  @ApiProperty({ description: 'Transaction quantity' })
  @IsNumber()
  quantity: number;

  @Field()
  @ApiProperty({ description: 'Transaction type' })
  @IsString()
  type: string;

  @Field()
  @ApiProperty({ description: 'Transaction reason' })
  @IsString()
  reason: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Unit cost' })
  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Performed by user' })
  @IsOptional()
  @IsString()
  performedBy?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Reference number' })
  @IsOptional()
  @IsString()
  reference?: string;
}

@ObjectType()
export class InventoryStatsResponse {
  @Field()
  @ApiProperty({ description: 'Total items in inventory' })
  totalItems: number;

  @Field()
  @ApiProperty({ description: 'Number of low stock items' })
  lowStockItems: number;

  @Field()
  @ApiProperty({ description: 'Number of out of stock items' })
  outOfStockItems: number;

  @Field()
  @ApiProperty({ description: 'Total inventory value' })
  totalValue: number;

  @Field()
  @ApiProperty({ description: 'Average inventory value per item' })
  averageValue: number;
}

@ObjectType()
export class PaginatedInventoryResponse {
  @Field(() => [Object])
  @ApiProperty({ description: 'List of inventory items' })
  inventory: any[];

  @Field()
  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @Field()
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @Field()
  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

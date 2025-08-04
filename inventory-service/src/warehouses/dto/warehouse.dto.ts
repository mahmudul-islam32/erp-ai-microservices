import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateWarehouseInput {
  @Field()
  @ApiProperty({ description: 'Warehouse name' })
  @IsString()
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse code' })
  @IsOptional()
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse type (e.g., main, secondary, distribution)' })
  @IsOptional()
  @IsString()
  type?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'State or province' })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse capacity' })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Current utilization percentage' })
  @IsOptional()
  @IsNumber()
  utilization?: number;

  @Field({ defaultValue: true })
  @ApiPropertyOptional({ description: 'Is warehouse active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ defaultValue: false })
  @ApiPropertyOptional({ description: 'Is this the main warehouse', default: false })
  @IsOptional()
  @IsBoolean()
  isMainWarehouse?: boolean;
}

@InputType()
export class UpdateWarehouseInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse name' })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse code' })
  @IsOptional()
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse type (e.g., main, secondary, distribution)' })
  @IsOptional()
  @IsString()
  type?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse address' })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse capacity' })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Current utilization percentage' })
  @IsOptional()
  @IsNumber()
  utilization?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Is warehouse active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Is this the main warehouse' })
  @IsOptional()
  @IsBoolean()
  isMainWarehouse?: boolean;
}

@InputType()
export class WarehouseFilterInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by warehouse type' })
  @IsOptional()
  @IsString()
  type?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by country' })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Search term for name, code, description, or address' })
  @IsOptional()
  @IsString()
  search?: string;
}

@ObjectType()
export class WarehouseResponse {
  @Field()
  @ApiProperty({ description: 'Warehouse ID' })
  _id: string;

  @Field()
  @ApiProperty({ description: 'Warehouse name' })
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse code' })
  code?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse description' })
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse type' })
  type?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Street address' })
  address?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'City' })
  city?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'State or province' })
  state?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Country' })
  country?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Postal code' })
  postalCode?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person name' })
  contactPerson?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact phone' })
  phone?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact email' })
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Warehouse capacity' })
  capacity?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Current utilization percentage' })
  utilization?: number;

  @Field()
  @ApiProperty({ description: 'Is warehouse active' })
  isActive: boolean;

  @Field()
  @ApiProperty({ description: 'Is this the main warehouse' })
  isMainWarehouse: boolean;

  @Field()
  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @Field()
  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

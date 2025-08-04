import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, IsBoolean, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@ObjectType()
@InputType('ContactPersonInput')
export class ContactPerson {
  @Field()
  @ApiProperty({ description: 'Contact person name' })
  @IsString()
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person position' })
  @IsOptional()
  @IsString()
  position?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

@ObjectType()
@InputType('AddressInput')
export class Address {
  @Field()
  @ApiProperty({ description: 'Street address' })
  @IsString()
  street: string;

  @Field()
  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'State or province' })
  @IsOptional()
  @IsString()
  state?: string;

  @Field()
  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

@InputType()
export class CreateSupplierInput {
  @Field()
  @ApiProperty({ description: 'Supplier name' })
  @IsString()
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Supplier code' })
  @IsOptional()
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Supplier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

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
  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Tax ID or VAT number' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Lead time in days' })
  @IsOptional()
  leadTime?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Credit limit' })
  @IsOptional()
  creditLimit?: number;

  @Field({ defaultValue: true })
  @ApiPropertyOptional({ description: 'Is supplier active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class UpdateSupplierInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Supplier code' })
  @IsOptional()
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Supplier description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

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
  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Tax ID or VAT number' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Lead time in days' })
  @IsOptional()
  leadTime?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Credit limit' })
  @IsOptional()
  creditLimit?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Is supplier active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class SupplierFilterInput {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
  @ApiPropertyOptional({ description: 'Search term for name, code, email, phone, or contact person' })
  @IsOptional()
  @IsString()
  search?: string;
}

@ObjectType()
export class SupplierResponse {
  @Field()
  @ApiProperty({ description: 'Supplier ID' })
  _id: string;

  @Field()
  @ApiProperty({ description: 'Supplier name' })
  name: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Supplier code' })
  code?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Supplier description' })
  description?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact person name' })
  contactPerson?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact email' })
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Contact phone' })
  phone?: string;

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
  @ApiPropertyOptional({ description: 'Website URL' })
  website?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Tax ID or VAT number' })
  taxId?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Payment terms' })
  paymentTerms?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Lead time in days' })
  leadTime?: number;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Credit limit' })
  creditLimit?: number;

  @Field()
  @ApiProperty({ description: 'Is supplier active' })
  isActive: boolean;

  @Field()
  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @Field()
  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

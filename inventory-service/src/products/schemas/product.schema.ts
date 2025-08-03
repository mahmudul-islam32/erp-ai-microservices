import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Field, ObjectType, ID, Float, Int } from '@nestjs/graphql';

export type ProductDocument = Product & Document;

@ObjectType()
@Schema({ 
  timestamps: true,
  collection: 'products'
})
export class Product {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  @Prop({ required: true, unique: true })
  sku: string;

  @Field()
  @Prop({ required: true })
  name: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Field(() => Float)
  @Prop({ required: true, min: 0 })
  price: number;

  @Field(() => Float)
  @Prop({ required: true, min: 0 })
  cost: number;

  @Field()
  @Prop({ required: true })
  unit: string; // e.g., 'piece', 'kg', 'liter', etc.

  @Field(() => Int)
  @Prop({ default: 0, min: 0 })
  minStockLevel: number;

  @Field(() => Int)
  @Prop({ default: 0, min: 0 })
  maxStockLevel: number;

  @Field(() => Int)
  @Prop({ default: 0, min: 0 })
  reorderPoint: number;

  @Field(() => Int)
  @Prop({ default: 0, min: 0 })
  reorderQuantity: number;

  @Field()
  @Prop({ default: true })
  isActive: boolean;

  @Field()
  @Prop({ default: false })
  isTrackable: boolean; // Whether to track serial numbers/batches

  @Field({ nullable: true })
  @Prop()
  barcode?: string;

  @Field(() => [String], { nullable: true })
  @Prop([String])
  images?: string[];

  @Field(() => Float, { nullable: true })
  @Prop()
  weight?: number;

  @Field(() => String, { nullable: true })
  @Prop()
  dimensions?: string; // JSON string for length, width, height

  @Field(() => [ID], { nullable: true })
  @Prop([{ type: Types.ObjectId, ref: 'Supplier' }])
  supplierIds?: Types.ObjectId[];

  @Field(() => String, { nullable: true })
  @Prop()
  tags?: string; // JSON string for search tags

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

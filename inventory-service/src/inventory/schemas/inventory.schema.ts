import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Field, ObjectType, ID, Int, Float } from '@nestjs/graphql';

export type InventoryDocument = Inventory & Document;

export enum InventoryTransactionType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
}

export enum InventoryTransactionReason {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  DAMAGE = 'damage',
  THEFT = 'theft',
  ADJUSTMENT = 'adjustment',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  PRODUCTION = 'production',
}

@ObjectType()
@Schema({ 
  timestamps: true,
  collection: 'inventory'
})
export class Inventory {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId: Types.ObjectId;

  @Field(() => Int)
  @Prop({ required: true, min: 0 })
  quantity: number;

  @Field(() => Int)
  @Prop({ required: true, min: 0 })
  reservedQuantity: number;

  @Field(() => Int)
  @Prop({ required: true, min: 0 })
  availableQuantity: number;

  @Field(() => Float)
  @Prop({ required: true, min: 0 })
  averageCost: number;

  @Field({ nullable: true })
  @Prop()
  batchNumber?: string;

  @Field({ nullable: true })
  @Prop()
  serialNumber?: string;

  @Field({ nullable: true })
  @Prop()
  expiryDate?: Date;

  @Field({ nullable: true })
  @Prop()
  location?: string; // Specific location within warehouse

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
@Schema({ 
  timestamps: true,
  collection: 'inventory_transactions'
})
export class InventoryTransaction {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId: Types.ObjectId;

  @Field()
  @Prop({ required: true, enum: Object.values(InventoryTransactionType) })
  type: InventoryTransactionType;

  @Field()
  @Prop({ required: true, enum: Object.values(InventoryTransactionReason) })
  reason: InventoryTransactionReason;

  @Field(() => Int)
  @Prop({ required: true })
  quantity: number;

  @Field(() => Float)
  @Prop({ required: true, min: 0 })
  unitCost: number;

  @Field(() => Float)
  @Prop({ required: true, min: 0 })
  totalCost: number;

  @Field(() => Int)
  @Prop({ required: true })
  balanceAfter: number;

  @Field({ nullable: true })
  @Prop()
  reference?: string; // Reference to related document (PO, SO, etc.)

  @Field({ nullable: true })
  @Prop()
  batchNumber?: string;

  @Field({ nullable: true })
  @Prop()
  serialNumber?: string;

  @Field({ nullable: true })
  @Prop()
  notes?: string;

  @Field()
  @Prop({ required: true })
  performedBy: string; // User ID who performed the transaction

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);
export const InventoryTransactionSchema = SchemaFactory.createForClass(InventoryTransaction);

// Add indexes for Inventory
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
InventorySchema.index({ productId: 1 });
InventorySchema.index({ warehouseId: 1 });
InventorySchema.index({ batchNumber: 1 });
InventorySchema.index({ serialNumber: 1 });

// Add indexes for InventoryTransaction
InventoryTransactionSchema.index({ productId: 1 });
InventoryTransactionSchema.index({ warehouseId: 1 });
InventoryTransactionSchema.index({ createdAt: -1 });
InventoryTransactionSchema.index({ type: 1 });
InventoryTransactionSchema.index({ reason: 1 });
InventoryTransactionSchema.index({ reference: 1 });

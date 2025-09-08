import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Field, ObjectType, ID } from '@nestjs/graphql';

export type WarehouseDocument = Warehouse & Document;

@ObjectType()
@Schema({ 
  timestamps: true,
  collection: 'warehouses'
})
export class Warehouse {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  name: string;

  @Field({ nullable: true })
  @Prop()
  code?: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  @Field({ nullable: true })
  @Prop()
  address?: string;

  @Field({ nullable: true })
  @Prop()
  city?: string;

  @Field({ nullable: true })
  @Prop()
  state?: string;

  @Field({ nullable: true })
  @Prop()
  country?: string;

  @Field({ nullable: true })
  @Prop()
  postalCode?: string;

  @Field({ nullable: true })
  @Prop()
  contactPerson?: string;

  @Field({ nullable: true })
  @Prop()
  phone?: string;

  @Field({ nullable: true })
  @Prop()
  email?: string;

  @Field()
  @Prop({ default: true })
  isActive: boolean;

  @Field()
  @Prop({ default: false })
  isMainWarehouse: boolean;

  @Field({ nullable: true })
  @Prop()
  capacity?: number;

  @Field({ nullable: true })
  @Prop()
  type?: string;

  @Field({ nullable: true })
  @Prop()
  notes?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);

// Add indexes
WarehouseSchema.index({ name: 1 });
WarehouseSchema.index({ code: 1 });
WarehouseSchema.index({ isActive: 1 });
WarehouseSchema.index({ isMainWarehouse: 1 });

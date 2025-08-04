import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Field, ObjectType, ID } from '@nestjs/graphql';

export type SupplierDocument = Supplier & Document;

@ObjectType()
@Schema({ 
  timestamps: true,
  collection: 'suppliers'
})
export class Supplier {
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

  @Field()
  @Prop({ required: true })
  contactPerson: string;

  @Field()
  @Prop({ required: true })
  email: string;

  @Field({ nullable: true })
  @Prop()
  phone?: string;

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
  website?: string;

  @Field({ nullable: true })
  @Prop()
  taxId?: string;

  @Field()
  @Prop({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Prop()
  notes?: string;

  @Field(() => [String], { nullable: true })
  @Prop([String])
  tags?: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

// Add indexes
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ code: 1 });
SupplierSchema.index({ email: 1 });
SupplierSchema.index({ isActive: 1 });

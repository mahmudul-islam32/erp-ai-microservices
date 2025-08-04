import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Field, ObjectType, ID } from '@nestjs/graphql';

export type CategoryDocument = Category & Document;

@ObjectType()
@Schema({ 
  timestamps: true,
  collection: 'categories'
})
export class Category {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  @Prop({ required: true, unique: true })
  name: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  @Field({ nullable: true })
  @Prop()
  code?: string;

  @Field(() => ID, { nullable: true })
  @Prop({ type: Types.ObjectId, ref: 'Category' })
  parentId?: Types.ObjectId;

  @Field()
  @Prop({ default: true })
  isActive: boolean;

  @Field()
  @Prop({ default: 0, min: 0 })
  sortOrder: number;

  @Field({ nullable: true })
  @Prop()
  image?: string;

  @Field(() => [String], { nullable: true })
  @Prop([String])
  tags?: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Add indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ code: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ sortOrder: 1 });

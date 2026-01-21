import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type FeedItemType = 'JOB' | 'EVENT' | 'MENTORSHIP';

export interface FeedItemAttributes {
  id: string;
  type: FeedItemType;
  itemId: string;
  priority: number;
  targetAudience?: string[];
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeedItemCreationAttributes extends Optional<FeedItemAttributes, 'id' | 'priority' | 'createdAt' | 'updatedAt'> {}

class FeedItem extends Model<FeedItemAttributes, FeedItemCreationAttributes> implements FeedItemAttributes {
  public id!: string;
  public type!: FeedItemType;
  public itemId!: string;
  public priority!: number;
  public targetAudience?: string[];
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FeedItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('JOB', 'EVENT', 'MENTORSHIP'),
      allowNull: false,
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    targetAudience: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'feed_items',
    timestamps: true,
  }
);

export default FeedItem;

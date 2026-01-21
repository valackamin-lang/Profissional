import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentType = 'SUBSCRIPTION' | 'EVENT' | 'MENTORSHIP' | 'COMMISSION';

export interface PaymentAttributes {
  id: string;
  userId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public userId!: string;
  public stripePaymentIntentId?: string;
  public amount!: number;
  public currency!: string;
  public type!: PaymentType;
  public status!: PaymentStatus;
  public description?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public user?: User;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('SUBSCRIPTION', 'EVENT', 'MENTORSHIP', 'COMMISSION'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
  }
);

export default Payment;

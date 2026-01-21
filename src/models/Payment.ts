import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentType = 'SUBSCRIPTION' | 'EVENT' | 'MENTORSHIP' | 'COMMISSION';

export interface PaymentAttributes {
  id: string;
  userId: string;
  mentorshipId?: string;
  eventId?: string;
  stripePaymentIntentId?: string;
  reference?: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  // Campos GPO
  gpoPurchaseToken?: string;
  gpoTransactionId?: string;
  gpoResponse?: Record<string, any>;
  paidAt?: Date;
  failureReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public userId!: string;
  public mentorshipId?: string;
  public eventId?: string;
  public stripePaymentIntentId?: string;
  public reference?: string;
  public amount!: number;
  public currency!: string;
  public type!: PaymentType;
  public status!: PaymentStatus;
  public description?: string;
  public metadata?: Record<string, any>;
  public gpoPurchaseToken?: string;
  public gpoTransactionId?: string;
  public gpoResponse?: Record<string, any>;
  public paidAt?: Date;
  public failureReason?: string;
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
    mentorshipId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'mentorships',
        key: 'id',
      },
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    reference: {
      type: DataTypes.STRING(15),
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'),
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
    gpoPurchaseToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gpoTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gpoResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failureReason: {
      type: DataTypes.TEXT,
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

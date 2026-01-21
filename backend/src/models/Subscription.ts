import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
export type SubscriptionPlan = 'MONTHLY' | 'ANNUAL';

export interface SubscriptionAttributes {
  id: string;
  userId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'status' | 'cancelAtPeriodEnd' | 'createdAt' | 'updatedAt'> {}

class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: string;
  public userId!: string;
  public stripeSubscriptionId?: string;
  public stripeCustomerId?: string;
  public plan!: SubscriptionPlan;
  public status!: SubscriptionStatus;
  public currentPeriodStart?: Date;
  public currentPeriodEnd?: Date;
  public cancelAtPeriodEnd!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public user?: User;
}

Subscription.init(
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
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plan: {
      type: DataTypes.ENUM('MONTHLY', 'ANNUAL'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE'),
      defaultValue: 'ACTIVE',
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
  }
);

export default Subscription;

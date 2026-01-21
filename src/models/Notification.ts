import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export type NotificationType = 'JOB' | 'EVENT' | 'MENTORSHIP' | 'APPLICATION' | 'SYSTEM';
export type NotificationStatus = 'UNREAD' | 'READ';

export interface NotificationAttributes {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  link?: string;
  metadata?: Record<string, any>;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public userId!: string;
  public type!: NotificationType;
  public title!: string;
  public message!: string;
  public status!: NotificationStatus;
  public link?: string;
  public metadata?: Record<string, any>;
  public readAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public user?: User;
}

Notification.init(
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
    type: {
      type: DataTypes.ENUM('JOB', 'EVENT', 'MENTORSHIP', 'APPLICATION', 'SYSTEM'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('UNREAD', 'READ'),
      defaultValue: 'UNREAD',
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
  }
);

export default Notification;

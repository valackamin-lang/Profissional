import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'LOGOUT' | 'ACTIVATE' | 'DEACTIVATE';
export type AuditResource = 'USER' | 'PROFILE' | 'JOB' | 'EVENT' | 'MENTORSHIP' | 'PAYMENT' | 'SUBSCRIPTION' | 'ROLE' | 'PERMISSION' | 'MENTORSHIP_SUBSCRIPTION' | 'POST';

export interface AuditLogAttributes {
  id: string;
  userId?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'createdAt'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: string;
  public userId?: string;
  public action!: AuditAction;
  public resource!: AuditResource;
  public resourceId?: string;
  public details?: Record<string, any>;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;

  public user?: User;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'ACTIVATE', 'DEACTIVATE'),
      allowNull: false,
    },
    resource: {
      type: DataTypes.ENUM('USER', 'PROFILE', 'JOB', 'EVENT', 'MENTORSHIP', 'PAYMENT', 'SUBSCRIPTION', 'ROLE', 'PERMISSION', 'MENTORSHIP_SUBSCRIPTION', 'POST'),
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
  }
);

export default AuditLog;

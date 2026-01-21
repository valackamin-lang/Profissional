import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PermissionAttributes {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: string;
  public name!: string;
  public resource!: string;
  public action!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
  }
);

export default Permission;

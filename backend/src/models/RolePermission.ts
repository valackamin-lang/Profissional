import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface RolePermissionAttributes {
  roleId: string;
  permissionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  public roleId!: string;
  public permissionId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permissionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    timestamps: true,
  }
);

export default RolePermission;

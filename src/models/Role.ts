import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Role.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: true,
  }
);

export default Role;

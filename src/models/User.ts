import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  roleId: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  refreshToken?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isEmailVerified' | 'twoFactorEnabled' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public roleId!: string;
  public isEmailVerified!: boolean;
  public twoFactorEnabled!: boolean;
  public twoFactorSecret?: string;
  public refreshToken?: string;
  public isActive?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public role?: Role;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;

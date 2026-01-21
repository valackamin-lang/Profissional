import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export type ProfileType = 'STUDENT' | 'PROFESSIONAL' | 'MENTOR' | 'COMPANY';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProfileAttributes {
  id: string;
  userId: string;
  type: ProfileType;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  resume?: string;
  portfolio?: string;
  companyName?: string;
  companyDocument?: string;
  companyLogo?: string;
  approvalStatus: ApprovalStatus;
  approvalNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProfileCreationAttributes extends Optional<ProfileAttributes, 'id' | 'approvalStatus' | 'createdAt' | 'updatedAt'> {}

class Profile extends Model<ProfileAttributes, ProfileCreationAttributes> implements ProfileAttributes {
  public id!: string;
  public userId!: string;
  public type!: ProfileType;
  public firstName?: string;
  public lastName?: string;
  public bio?: string;
  public avatar?: string;
  public resume?: string;
  public portfolio?: string;
  public companyName?: string;
  public companyDocument?: string;
  public companyLogo?: string;
  public approvalStatus!: ApprovalStatus;
  public approvalNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public user?: User;
}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('STUDENT', 'PROFESSIONAL', 'MENTOR', 'COMPANY'),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resume: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    portfolio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyDocument: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyLogo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approvalStatus: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    approvalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'profiles',
    timestamps: true,
  }
);

export default Profile;

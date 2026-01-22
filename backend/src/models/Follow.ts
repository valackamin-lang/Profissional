import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Profile from './Profile';

export interface FollowAttributes {
  id: string;
  followerId: string; // Quem está seguindo
  followingId: string; // Quem está sendo seguido
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FollowCreationAttributes extends Optional<FollowAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Follow extends Model<FollowAttributes, FollowCreationAttributes> implements FollowAttributes {
  public id!: string;
  public followerId!: string;
  public followingId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public follower?: Profile;
  public following?: Profile;
}

Follow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    followerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'follows',
    timestamps: true,
    indexes: [
      { fields: ['followerId'] },
      { fields: ['followingId'] },
      { unique: true, fields: ['followerId', 'followingId'] }, // Um usuário só pode seguir outro uma vez
    ],
  }
);

// Associations são definidas em models/index.ts

export default Follow;

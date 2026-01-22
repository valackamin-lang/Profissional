import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Post from './Post';
import Profile from './Profile';

export interface PostLikeAttributes {
  id: string;
  postId: string;
  userId: string;
  createdAt?: Date;
}

export interface PostLikeCreationAttributes extends Optional<PostLikeAttributes, 'id' | 'createdAt'> {}

class PostLike extends Model<PostLikeAttributes, PostLikeCreationAttributes> implements PostLikeAttributes {
  public id!: string;
  public postId!: string;
  public userId!: string;
  public readonly createdAt!: Date;

  public post?: Post;
  public user?: Profile;
}

PostLike.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    userId: {
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
    tableName: 'post_likes',
    timestamps: true,
    indexes: [
      { fields: ['postId'] },
      { fields: ['userId'] },
      { unique: true, fields: ['postId', 'userId'] }, // Um usuário só pode curtir uma vez
    ],
  }
);

// Associations são definidas em models/index.ts

export default PostLike;

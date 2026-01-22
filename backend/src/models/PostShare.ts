import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Post from './Post';
import Profile from './Profile';

export interface PostShareAttributes {
  id: string;
  postId: string;
  userId: string;
  comment?: string; // Comentário opcional ao compartilhar
  createdAt?: Date;
}

export interface PostShareCreationAttributes extends Optional<PostShareAttributes, 'id' | 'comment' | 'createdAt'> {}

class PostShare extends Model<PostShareAttributes, PostShareCreationAttributes> implements PostShareAttributes {
  public id!: string;
  public postId!: string;
  public userId!: string;
  public comment?: string;
  public readonly createdAt!: Date;

  public post?: Post;
  public user?: Profile;
}

PostShare.init(
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
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'post_shares',
    timestamps: true,
    indexes: [
      { fields: ['postId'] },
      { fields: ['userId'] },
    ],
  }
);

// Associations são definidas em models/index.ts

export default PostShare;

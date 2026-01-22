import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Post from './Post';
import Profile from './Profile';

export interface PostCommentAttributes {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string; // Para comentários aninhados (respostas)
  likesCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PostCommentCreationAttributes extends Optional<PostCommentAttributes, 'id' | 'parentId' | 'likesCount' | 'createdAt' | 'updatedAt'> {}

class PostComment extends Model<PostCommentAttributes, PostCommentCreationAttributes> implements PostCommentAttributes {
  public id!: string;
  public postId!: string;
  public authorId!: string;
  public content!: string;
  public parentId?: string;
  public likesCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public post?: Post;
  public author?: Profile;
  public parent?: PostComment;
  public replies?: PostComment[];
}

PostComment.init(
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
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'post_comments',
        key: 'id',
      },
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'post_comments',
    timestamps: true,
    indexes: [
      { fields: ['postId'] },
      { fields: ['authorId'] },
      { fields: ['parentId'] },
    ],
  }
);

// Associations são definidas em models/index.ts

export default PostComment;

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Profile from './Profile';

export interface PostAttributes {
  id: string;
  authorId: string;
  content: string;
  media?: string[]; // Array de URLs de imagens/vídeos
  mediaType?: 'image' | 'video' | 'mixed';
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'media' | 'mediaType' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'createdAt' | 'updatedAt'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: string;
  public authorId!: string;
  public content!: string;
  public media?: string[];
  public mediaType?: 'image' | 'video' | 'mixed';
  public visibility!: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  public likesCount!: number;
  public commentsCount!: number;
  public sharesCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public author?: Profile;
}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    media: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video', 'mixed'),
      allowNull: true,
    },
    visibility: {
      type: DataTypes.ENUM('PUBLIC', 'FOLLOWERS', 'PRIVATE'),
      defaultValue: 'PUBLIC',
      allowNull: false,
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    commentsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    sharesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
    indexes: [
      { fields: ['authorId'] },
      { fields: ['createdAt'] },
      { fields: ['visibility'] },
    ],
  }
);

// Associations são definidas em models/index.ts

export default Post;

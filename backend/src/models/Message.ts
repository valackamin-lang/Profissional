import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type MessageType = 'text' | 'image' | 'file' | 'system';

interface MessageAttributes {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  readAt?: Date;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'readAt' | 'mediaUrl' | 'fileName' | 'fileSize' | 'createdAt' | 'updatedAt'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public chatId!: string;
  public senderId!: string;
  public content!: string;
  public type!: MessageType;
  public readAt?: Date;
  public mediaUrl?: string;
  public fileName?: string;
  public fileSize?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chats',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    senderId: {
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
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      defaultValue: 'text',
      allowNull: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'messages',
    indexes: [
      {
        fields: ['chatId', 'createdAt'],
      },
      {
        fields: ['senderId'],
      },
      {
        fields: ['readAt'],
      },
    ],
  }
);

export default Message;

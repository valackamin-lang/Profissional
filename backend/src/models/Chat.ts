import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ChatAttributes {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt?: Date;
  lastMessage?: string;
  unreadCount1: number; // Mensagens não lidas para participant1
  unreadCount2: number; // Mensagens não lidas para participant2
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatCreationAttributes extends Optional<ChatAttributes, 'id' | 'lastMessageAt' | 'lastMessage' | 'unreadCount1' | 'unreadCount2' | 'createdAt' | 'updatedAt'> {}

class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  public id!: string;
  public participant1Id!: string;
  public participant2Id!: string;
  public lastMessageAt?: Date;
  public lastMessage?: string;
  public unreadCount1!: number;
  public unreadCount2!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Chat.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    participant1Id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    participant2Id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unreadCount1: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    unreadCount2: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'chats',
    indexes: [
      {
        unique: true,
        fields: ['participant1Id', 'participant2Id'],
        name: 'unique_chat_participants',
      },
      {
        fields: ['participant1Id'],
      },
      {
        fields: ['participant2Id'],
      },
      {
        fields: ['lastMessageAt'],
      },
    ],
  }
);

export default Chat;

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Profile from './Profile';

export type MentorshipStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface MentorshipAttributes {
  id: string;
  title: string;
  description: string;
  mentorId: string;
  price: number;
  duration: number;
  status: MentorshipStatus;
  maxStudents?: number;
  currentStudents?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MentorshipCreationAttributes extends Optional<MentorshipAttributes, 'id' | 'status' | 'currentStudents' | 'createdAt' | 'updatedAt'> {}

class Mentorship extends Model<MentorshipAttributes, MentorshipCreationAttributes> implements MentorshipAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public mentorId!: string;
  public price!: number;
  public duration!: number;
  public status!: MentorshipStatus;
  public maxStudents?: number;
  public currentStudents?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public mentor?: Profile;
}

Mentorship.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mentorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in hours',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
      defaultValue: 'ACTIVE',
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'mentorships',
    timestamps: true,
  }
);

export default Mentorship;

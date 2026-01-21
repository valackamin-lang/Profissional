import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Mentorship from './Mentorship';
import Profile from './Profile';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export interface MentorshipSubscriptionAttributes {
  id: string;
  mentorshipId: string;
  studentId: string;
  status: SubscriptionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MentorshipSubscriptionCreationAttributes extends Optional<MentorshipSubscriptionAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class MentorshipSubscription extends Model<MentorshipSubscriptionAttributes, MentorshipSubscriptionCreationAttributes> implements MentorshipSubscriptionAttributes {
  public id!: string;
  public mentorshipId!: string;
  public studentId!: string;
  public status!: SubscriptionStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public mentorship?: Mentorship;
  public student?: Profile;
}

MentorshipSubscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mentorshipId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'mentorships',
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CANCELLED', 'COMPLETED'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'mentorship_subscriptions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['mentorshipId', 'studentId'],
      },
    ],
  }
);

// Relationships are defined in models/index.ts

export default MentorshipSubscription;

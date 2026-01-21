import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Event from './Event';
import Profile from './Profile';

export type RegistrationStatus = 'REGISTERED' | 'CANCELLED' | 'ATTENDED';

export interface EventRegistrationAttributes {
  id: string;
  eventId: string;
  attendeeId: string;
  status: RegistrationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventRegistrationCreationAttributes extends Optional<EventRegistrationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class EventRegistration extends Model<EventRegistrationAttributes, EventRegistrationCreationAttributes> implements EventRegistrationAttributes {
  public id!: string;
  public eventId!: string;
  public attendeeId!: string;
  public status!: RegistrationStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public event?: Event;
  public attendee?: Profile;
}

EventRegistration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    attendeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('REGISTERED', 'CANCELLED', 'ATTENDED'),
      defaultValue: 'REGISTERED',
    },
  },
  {
    sequelize,
    tableName: 'event_registrations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['eventId', 'attendeeId'],
      },
    ],
  }
);

// Relationships are defined in models/index.ts

export default EventRegistration;

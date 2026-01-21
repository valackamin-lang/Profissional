import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Profile from './Profile';

export type EventType = 'WORKSHOP' | 'WEBINAR' | 'CONFERENCE';
export type EventStatus = 'UPCOMING' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface EventAttributes {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  organizerId: string;
  eventDate: Date;
  videoLink?: string;
  zoomMeetingId?: string;
  youtubeStreamId?: string;
  price?: number;
  maxAttendees?: number;
  currentAttendees?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventCreationAttributes extends Optional<EventAttributes, 'id' | 'status' | 'currentAttendees' | 'createdAt' | 'updatedAt'> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public type!: EventType;
  public status!: EventStatus;
  public organizerId!: string;
  public eventDate!: Date;
  public videoLink?: string;
  public zoomMeetingId?: string;
  public youtubeStreamId?: string;
  public price?: number;
  public maxAttendees?: number;
  public currentAttendees?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public organizer?: Profile;
}

Event.init(
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
    type: {
      type: DataTypes.ENUM('WORKSHOP', 'WEBINAR', 'CONFERENCE'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('UPCOMING', 'LIVE', 'ENDED', 'CANCELLED'),
      defaultValue: 'UPCOMING',
    },
    organizerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    videoLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zoomMeetingId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    youtubeStreamId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    maxAttendees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentAttendees: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'events',
    timestamps: true,
  }
);

export default Event;

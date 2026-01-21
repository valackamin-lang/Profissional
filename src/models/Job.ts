import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Profile from './Profile';

export type JobType = 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type JobStatus = 'OPEN' | 'CLOSED' | 'PAUSED';

export interface JobAttributes {
  id: string;
  title: string;
  description: string;
  company: string;
  location?: string;
  type: JobType;
  status: JobStatus;
  postedBy: string;
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  applicationDeadline?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public company!: string;
  public location?: string;
  public type!: JobType;
  public status!: JobStatus;
  public postedBy!: string;
  public requirements?: string;
  public salaryMin?: number;
  public salaryMax?: number;
  public applicationDeadline?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public profile?: Profile;
}

Job.init(
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
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'CLOSED', 'PAUSED'),
      defaultValue: 'OPEN',
    },
    postedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    salaryMin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    salaryMax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    applicationDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'jobs',
    timestamps: true,
  }
);

export default Job;

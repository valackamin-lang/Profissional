import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Job from './Job';
import Profile from './Profile';

export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';

export interface JobApplicationAttributes {
  id: string;
  jobId: string;
  applicantId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resume?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobApplicationCreationAttributes extends Optional<JobApplicationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class JobApplication extends Model<JobApplicationAttributes, JobApplicationCreationAttributes> implements JobApplicationAttributes {
  public id!: string;
  public jobId!: string;
  public applicantId!: string;
  public status!: ApplicationStatus;
  public coverLetter?: string;
  public resume?: string;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public job?: Job;
  public applicant?: Profile;
}

JobApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id',
      },
    },
    applicantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resume: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'job_applications',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['jobId', 'applicantId'],
      },
    ],
  }
);

export default JobApplication;

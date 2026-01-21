import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import JobApplication from '../models/JobApplication';
import Job from '../models/Job';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';

export const applyToJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { jobId } = req.params;
    const { coverLetter, resume } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new AppError('Vaga não encontrada', 404);
    }

    if (job.status !== 'OPEN') {
      throw new AppError('Vaga não está aberta para candidaturas', 400);
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      where: { jobId, applicantId: profile.id },
    });

    if (existingApplication) {
      throw new AppError('Você já se candidatou a esta vaga', 409);
    }

    const application = await JobApplication.create({
      jobId,
      applicantId: profile.id,
      coverLetter,
      resume,
      status: 'PENDING',
    });

    // Notify job poster
    const jobProfile = await Profile.findByPk(job.postedBy, { include: [{ model: User, as: 'user' }] });
    if (jobProfile?.user) {
      await Notification.create({
        userId: jobProfile.user.id,
        type: 'APPLICATION',
        title: 'Nova candidatura',
        message: `Nova candidatura para a vaga: ${job.title}`,
        link: `/jobs/${jobId}/applications/${application.id}`,
        metadata: { jobId, applicationId: application.id },
      });
    }

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'JOB',
      resourceId: jobId,
      details: { applicationId: application.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { jobId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    // Check if user owns the job or is admin
    const job = await Job.findByPk(jobId);
    if (!job) {
      throw new AppError('Vaga não encontrada', 404);
    }

    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    const isOwner = job.postedBy === profile.id;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    const where: any = { jobId };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: applications } = await JobApplication.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'applicant',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Job,
          as: 'job',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const application = await JobApplication.findByPk(id, {
      include: [
        {
          model: Job,
          as: 'job',
          include: [
            {
              model: Profile,
              as: 'profile',
              include: [{ model: User, as: 'user' }],
            },
          ],
        },
        {
          model: Profile,
          as: 'applicant',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!application) {
      throw new AppError('Candidatura não encontrada', 404);
    }

    // Check if user owns the job or is admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    const isOwner = application.job?.profile?.user?.id === userId;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    if (!['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'].includes(status)) {
      throw new AppError('Status inválido', 400);
    }

    application.status = status;
    if (notes !== undefined) application.notes = notes;
    await application.save();

    // Notify applicant
    if (application.applicant?.user) {
      await Notification.create({
        userId: application.applicant.user.id,
        type: 'APPLICATION',
        title: 'Status da candidatura atualizado',
        message: `Sua candidatura para ${application.job?.title} foi ${status}`,
        link: `/applications/${id}`,
        metadata: { applicationId: id, status },
      });
    }

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'JOB',
      resourceId: application.jobId,
      details: { applicationId: id, status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

// Get all applications for the current user (student)
export const getMyApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const where: any = { applicantId: profile.id };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: applications } = await JobApplication.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'company', 'type', 'location', 'status'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all applications for all company's jobs
export const getAllCompanyApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    if (profile.type !== 'COMPANY') {
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models/Role').default, as: 'role' }],
      });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Apenas empresas podem acessar esta funcionalidade', 403);
      }
    }

    // Get all jobs by this company
    const jobs = await Job.findAll({
      where: { postedBy: profile.id },
      attributes: ['id'],
    });

    const jobIds = jobs.map((j) => j.id);

    const where: any = { jobId: { [Op.in]: jobIds } };
    if (status) where.status = status;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: applications } = await JobApplication.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'applicant',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'company'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single application by ID
export const getApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Perfil não encontrado', 404);
    }

    const application = await JobApplication.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'applicant',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
        {
          model: Job,
          as: 'job',
          include: [
            {
              model: Profile,
              as: 'profile',
              attributes: ['id', 'companyName', 'companyLogo'],
            },
          ],
        },
      ],
    });

    if (!application) {
      throw new AppError('Candidatura não encontrada', 404);
    }

    // Check permissions: applicant, job owner, or admin
    const user = await User.findByPk(userId, {
      include: [{ model: require('../models/Role').default, as: 'role' }],
    });

    const isApplicant = application.applicantId === profile.id;
    const isJobOwner = application.job?.postedBy === profile.id;
    const isAdmin = user?.role?.name === 'ADMIN';

    if (!isApplicant && !isJobOwner && !isAdmin) {
      throw new AppError('Acesso negado', 403);
    }

    res.json({
      success: true,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};

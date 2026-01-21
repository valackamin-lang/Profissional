import { Response, NextFunction } from 'express';
import Job from '../models/Job';
import Profile from '../models/Profile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import AuditLog from '../models/AuditLog';
import { Op } from 'sequelize';

export const createJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const profile = await Profile.findOne({ where: { userId } });
    if (!profile || profile.type !== 'COMPANY') {
      throw new AppError('Apenas empresas podem publicar vagas', 403);
    }

    if (profile.approvalStatus !== 'APPROVED') {
      throw new AppError('Perfil não aprovado para publicar vagas', 403);
    }

    const { title, description, company, location, type, requirements, salaryMin, salaryMax, applicationDeadline } = req.body;

    if (!title || !description || !company || !type) {
      throw new AppError('Campos obrigatórios: title, description, company, type', 400);
    }

    const job = await Job.create({
      title,
      description,
      company,
      location,
      type,
      requirements,
      salaryMin,
      salaryMax,
      applicationDeadline,
      postedBy: profile.id,
      status: 'OPEN',
    });

    // Add to feed
    const { addToFeed } = await import('../services/feedService');
    await addToFeed('JOB', job.id, 5);

    // Audit log
    await AuditLog.create({
      userId,
      action: 'CREATE',
      resource: 'JOB',
      resourceId: job.id,
      details: { title: job.title, company: job.company },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, type, location, status = 'OPEN', search, minSalary, maxSalary } = req.query;

    const where: any = { status };

    if (type) where.type = type;
    if (location) where.location = { [Op.iLike]: `%${location}%` };
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (minSalary) where.salaryMin = { [Op.gte]: minSalary };
    if (maxSalary) where.salaryMax = { [Op.lte]: maxSalary };

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: Profile,
          as: 'profile',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        jobs,
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

export const getJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'profile',
          include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
        },
      ],
    });

    if (!job) {
      throw new AppError('Vaga não encontrada', 404);
    }

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (
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

    const job = await Job.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'profile',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!job) {
      throw new AppError('Vaga não encontrada', 404);
    }

    // Check if user owns the job or is admin
    if (job.profile?.user?.id !== userId) {
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models/Role').default, as: 'role' }],
      });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Acesso negado', 403);
      }
    }

    const { title, description, company, location, type, requirements, salaryMin, salaryMax, status, applicationDeadline } = req.body;

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (company !== undefined) job.company = company;
    if (location !== undefined) job.location = location;
    if (type !== undefined) job.type = type;
    if (requirements !== undefined) job.requirements = requirements;
    if (salaryMin !== undefined) job.salaryMin = salaryMin;
    if (salaryMax !== undefined) job.salaryMax = salaryMax;
    if (status !== undefined) job.status = status;
    if (applicationDeadline !== undefined) job.applicationDeadline = applicationDeadline;

    await job.save();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'UPDATE',
      resource: 'JOB',
      resourceId: job.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (
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

    const job = await Job.findByPk(id, {
      include: [
        {
          model: Profile,
          as: 'profile',
          include: [{ model: User, as: 'user' }],
        },
      ],
    });

    if (!job) {
      throw new AppError('Vaga não encontrada', 404);
    }

    // Check if user owns the job or is admin
    if (job.profile?.user?.id !== userId) {
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models/Role').default, as: 'role' }],
      });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Acesso negado', 403);
      }
    }

    await job.destroy();

    // Audit log
    await AuditLog.create({
      userId,
      action: 'DELETE',
      resource: 'JOB',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Vaga deletada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

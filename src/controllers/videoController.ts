import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createZoomMeeting,
  createYouTubeStream,
  updateEventWithVideo,
  verifyEventAccess,
} from '../services/videoService';
import Event from '../models/Event';
import { AppError } from '../utils/AppError';

export const createEventVideo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { eventId, videoType, title, startTime, duration } = req.body;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!eventId || !videoType || !title || !startTime) {
      throw new AppError('Campos obrigatórios: eventId, videoType, title, startTime', 400);
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado', 404);
    }

    // Check if user owns the event
    if (event.organizerId !== userId) {
      const User = (await import('../models/User')).default;
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models/Role').default, as: 'role' }],
      });
      if (user?.role?.name !== 'ADMIN') {
        throw new AppError('Acesso negado', 403);
      }
    }

    let videoData: any;

    if (videoType === 'ZOOM') {
      const meeting = await createZoomMeeting(title, new Date(startTime), duration || 60);
      videoData = {
        meetingId: meeting.meetingId,
        joinUrl: meeting.joinUrl,
      };
      await updateEventWithVideo(eventId, 'ZOOM', videoData);
    } else if (videoType === 'YOUTUBE') {
      const stream = await createYouTubeStream(title, event.description, new Date(startTime));
      videoData = {
        streamId: stream.streamId,
        streamUrl: stream.streamUrl,
      };
      await updateEventWithVideo(eventId, 'YOUTUBE', videoData);
    } else {
      throw new AppError('Tipo de vídeo inválido. Use ZOOM ou YOUTUBE', 400);
    }

    res.json({
      success: true,
      data: { videoData },
    });
  } catch (error) {
    next(error);
  }
};

export const getEventVideoLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { eventId } = req.params;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado', 404);
    }

    // Verify access
    const hasAccess = await verifyEventAccess(eventId, userId);
    if (!hasAccess) {
      throw new AppError('Acesso negado ao evento', 403);
    }

    if (!event.videoLink) {
      throw new AppError('Link de vídeo não disponível para este evento', 404);
    }

    res.json({
      success: true,
      data: {
        videoLink: event.videoLink,
        zoomMeetingId: event.zoomMeetingId,
        youtubeStreamId: event.youtubeStreamId,
      },
    });
  } catch (error) {
    next(error);
  }
};

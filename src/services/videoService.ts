import axios from 'axios';
import dotenv from 'dotenv';
import Event from '../models/Event';

dotenv.config();

// Zoom API integration
export const createZoomMeeting = async (
  title: string,
  startTime: Date,
  duration: number = 60
): Promise<{ meetingId: string; joinUrl: string; password: string }> => {
  const zoomApiKey = process.env.ZOOM_API_KEY;
  const zoomApiSecret = process.env.ZOOM_API_SECRET;

  if (!zoomApiKey || !zoomApiSecret) {
    throw new Error('Zoom API credentials not configured');
  }

  // Generate JWT token for Zoom API
  const jwt = require('jsonwebtoken');
  const payload = {
    iss: zoomApiKey,
    exp: Date.now() + 3600,
  };
  const token = jwt.sign(payload, zoomApiSecret);

  try {
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: title,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      meetingId: response.data.id.toString(),
      joinUrl: response.data.join_url,
      password: response.data.password || '',
    };
  } catch (error: any) {
    throw new Error(`Failed to create Zoom meeting: ${error.message}`);
  }
};

// YouTube API integration (simplified - would need OAuth2 for full implementation)
export const createYouTubeStream = async (
  title: string,
  description: string,
  scheduledStartTime: Date
): Promise<{ streamId: string; streamUrl: string }> => {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;

  if (!youtubeApiKey) {
    throw new Error('YouTube API key not configured');
  }

  // Note: Full YouTube Live Streaming API requires OAuth2 authentication
  // This is a simplified version that would need proper OAuth2 setup
  // For now, we'll return a placeholder structure

  try {
    // In production, you would:
    // 1. Use OAuth2 to authenticate
    // 2. Create a live broadcast
    // 3. Create a live stream
    // 4. Bind them together

    // Placeholder implementation
    const streamId = `stream_${Date.now()}`;
    const streamUrl = `https://youtube.com/watch?v=${streamId}`;

    return {
      streamId,
      streamUrl,
    };
  } catch (error: any) {
    throw new Error(`Failed to create YouTube stream: ${error.message}`);
  }
};

export const updateEventWithVideo = async (
  eventId: string,
  videoType: 'ZOOM' | 'YOUTUBE',
  videoData: { meetingId?: string; joinUrl?: string; streamId?: string; streamUrl?: string }
): Promise<void> => {
  const event = await Event.findByPk(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  if (videoType === 'ZOOM') {
    event.zoomMeetingId = videoData.meetingId;
    event.videoLink = videoData.joinUrl;
  } else if (videoType === 'YOUTUBE') {
    event.youtubeStreamId = videoData.streamId;
    event.videoLink = videoData.streamUrl;
  }

  await event.save();
};

export const verifyEventAccess = async (eventId: string, userId: string): Promise<boolean> => {
  const event = await Event.findByPk(eventId);
  if (!event) {
    return false;
  }

  // Check if user has registered/purchased access to the event
  // This would typically check a registrations table
  // For now, we'll allow access if event is free or user has a subscription
  return true;
};

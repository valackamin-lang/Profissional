import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const uploadDir = process.env.UPLOAD_PATH || './uploads';
const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'); // 10MB default

// Ensure upload directories exist
const ensureDirectories = () => {
  const dirs = [
    path.join(uploadDir, 'avatars'),
    path.join(uploadDir, 'resumes'),
    path.join(uploadDir, 'portfolios'),
    path.join(uploadDir, 'documents'),
    path.join(uploadDir, 'logos'),
    path.join(uploadDir, 'posts'),
    path.join(uploadDir, 'chat'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;

    if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadDir, 'avatars');
    } else if (file.fieldname === 'resume') {
      uploadPath = path.join(uploadDir, 'resumes');
    } else if (file.fieldname === 'portfolio') {
      uploadPath = path.join(uploadDir, 'portfolios');
    } else if (file.fieldname === 'document') {
      uploadPath = path.join(uploadDir, 'documents');
    } else if (file.fieldname === 'logo') {
      uploadPath = path.join(uploadDir, 'logos');
    } else if (file.fieldname === 'media' || file.fieldname === 'postMedia') {
      uploadPath = path.join(uploadDir, 'posts');
    } else if (file.fieldname === 'chatMedia') {
      uploadPath = path.join(uploadDir, 'chat');
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes: Record<string, string[]> = {
    avatar: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
    resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    portfolio: ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/vnd.rar'],
    document: ['application/pdf', 'image/jpeg', 'image/png'],
    logo: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
    media: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
    postMedia: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
    chatMedia: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/msword'],
  };

  const allowedTypes = allowedMimes[file.fieldname] || allowedMimes.document;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: maxSize,
  },
  fileFilter,
});

export const uploadFields = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
  { name: 'document', maxCount: 5 },
  { name: 'logo', maxCount: 1 },
  { name: 'media', maxCount: 10 },
  { name: 'postMedia', maxCount: 10 },
]);

export const uploadPostMedia = upload.fields([
  { name: 'media', maxCount: 10 },
]);

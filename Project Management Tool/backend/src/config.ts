import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-project-management-tool-2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { CORS_ORIGIN } from './config.js';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // Join a project room
    socket.on('join_project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    // Leave a project room
    socket.on('leave_project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Join a personal user room for direct notifications
    socket.on('join_user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Real-time helper triggers
export const emitTaskCreated = (projectId: string, task: any) => {
  if (io) io.to(`project:${projectId}`).emit('task_created', task);
};

export const emitTaskUpdated = (projectId: string, task: any) => {
  if (io) io.to(`project:${projectId}`).emit('task_updated', task);
};

export const emitTaskMoved = (projectId: string, data: { taskId: string; columnId: string; order: number; task: any }) => {
  if (io) io.to(`project:${projectId}`).emit('task_moved', data);
};

export const emitTaskDeleted = (projectId: string, taskId: string) => {
  if (io) io.to(`project:${projectId}`).emit('task_deleted', { taskId });
};

export const emitCommentAdded = (projectId: string, comment: any) => {
  if (io) io.to(`project:${projectId}`).emit('comment_added', comment);
};

export const emitCommentDeleted = (projectId: string, commentId: string, taskId: string) => {
  if (io) io.to(`project:${projectId}`).emit('comment_deleted', { commentId, taskId });
};

export const emitNotification = (userId: string, notification: any) => {
  if (io) io.to(`user:${userId}`).emit('new_notification', notification);
};

export const emitActivity = (projectId: string, activity: any) => {
  if (io) io.to(`project:${projectId}`).emit('new_activity', activity);
};

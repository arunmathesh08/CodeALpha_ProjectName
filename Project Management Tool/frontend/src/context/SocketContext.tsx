import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../services/api';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      // Join user room for private notifications
      s.emit('join_user', user.id);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user?.id]);

  const joinProject = (projectId: string) => {
    if (socket) {
      socket.emit('join_project', projectId);
    }
  };

  const leaveProject = (projectId: string) => {
    if (socket) {
      socket.emit('leave_project', projectId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinProject, leaveProject }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

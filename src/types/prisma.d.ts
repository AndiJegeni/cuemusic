import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export type SoundLibrary = {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Sound = {
  id: string;
  name: string;
  description: string | null;
  audioUrl: string;
  libraryId: string;
  createdAt: Date;
  updatedAt: Date;
}; 
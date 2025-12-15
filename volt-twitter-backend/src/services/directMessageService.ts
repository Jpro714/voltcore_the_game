import { Prisma, User as PrismaUser } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  ConversationSummaryResponse,
  ConversationThreadResponse,
  DirectMessageResponse,
  User,
} from '../models';
import { requireProfile } from './feedService';

type DirectMessageWithUsers = Prisma.DirectMessageGetPayload<{ include: { sender: true; recipient: true } }>;

const mapBasicUser = (user: PrismaUser): User => ({
  id: user.id,
  handle: user.handle,
  displayName: user.displayName,
  avatar: user.avatar,
  tagline: user.tagline,
  bio: user.bio,
  location: user.location,
});

const mapMessage = (message: DirectMessageWithUsers, viewerId: string): DirectMessageResponse => ({
  id: message.id,
  content: message.content,
  timestamp: message.createdAt.toISOString(),
  sender: mapBasicUser(message.sender),
  recipient: mapBasicUser(message.recipient),
  isMine: message.senderId === viewerId,
  readAt: message.readAt ? message.readAt.toISOString() : undefined,
});

const findUserByIdentifier = (identifier: string) =>
  prisma.user.findFirst({
    where: {
      OR: [{ handle: identifier }, { id: identifier }],
    },
  });

const findUserOrThrow = async (identifier: string) => {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const getConversationSummaries = async (): Promise<ConversationSummaryResponse[]> => {
  const profile = await requireProfile();
  const viewerId = profile.userId;

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [{ senderId: viewerId }, { recipientId: viewerId }],
    },
    include: { sender: true, recipient: true },
    orderBy: { createdAt: 'desc' },
  });

  const summaries = new Map<string, ConversationSummaryResponse>();

  for (const message of messages) {
    const otherUser = message.senderId === viewerId ? message.recipient : message.sender;
    const key = otherUser.id;
    if (!summaries.has(key)) {
      summaries.set(key, {
        user: mapBasicUser(otherUser),
        lastMessage: mapMessage(message, viewerId),
        unreadCount: 0,
      });
    }
    if (message.recipientId === viewerId && !message.readAt) {
      const summary = summaries.get(key);
      if (summary) {
        summary.unreadCount += 1;
      }
    }
  }

  return Array.from(summaries.values());
};

export const getConversationThread = async (identifier: string): Promise<ConversationThreadResponse> => {
  const profile = await requireProfile();
  const viewerId = profile.userId;
  const target = await findUserOrThrow(identifier);

  await prisma.directMessage.updateMany({
    where: {
      senderId: target.id,
      recipientId: viewerId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: viewerId, recipientId: target.id },
        { senderId: target.id, recipientId: viewerId },
      ],
    },
    include: { sender: true, recipient: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    user: mapBasicUser(target),
    messages: messages.map((message) => mapMessage(message, viewerId)),
  };
};

export const sendDirectMessage = async (identifier: string, content: string): Promise<DirectMessageResponse> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty');
  }

  const profile = await requireProfile();
  const viewerId = profile.userId;
  const target = await findUserOrThrow(identifier);

  if (target.id === viewerId) {
    throw new Error('Cannot send a direct message to yourself');
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId: viewerId,
      recipientId: target.id,
      content: trimmed,
    },
    include: { sender: true, recipient: true },
  });

  return mapMessage(message, viewerId);
};

export const sendDirectMessageAsUser = async (
  senderIdentifier: string,
  recipientIdentifier: string,
  content: string,
): Promise<DirectMessageResponse> => {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty');
  }

  const sender = await findUserOrThrow(senderIdentifier);
  const recipient = await findUserOrThrow(recipientIdentifier);

  if (sender.id === recipient.id) {
    throw new Error('Cannot send a direct message to yourself');
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId: sender.id,
      recipientId: recipient.id,
      content: trimmed,
    },
    include: { sender: true, recipient: true },
  });

  return mapMessage(message, sender.id);
};

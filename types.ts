
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type NotificationType = 'like' | 'comment' | 'follow' | 'system' | 'mention' | 'invite';

export interface Notification {
  id: string;
  type: NotificationType;
  actorName: string;
  actorAvatar: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage?: string;
  memberIds: string[];
  restrictedIds?: string[]; // Banned/Restricted users
  ownerId: string;
  privacy: 'public' | 'private';
}

export interface Page {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage?: string;
  category: string;
  followerIds: string[];
  ownerId: string;
}

export interface PostComment {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp?: any;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  password?: string;
  avatar: string;
  bio: string;
  location?: string;
  work?: string;
  school?: string;
  nickname?: string;
  religion?: string;
  politicalParty?: string;
  relationshipStatus?: string;
  followers: number;
  following: number;
  postsCount?: number;
  blockedUserIds?: string[];
}

export interface Post {
  id: string;
  userId: string;
  groupId?: string; 
  pageId?: string;  
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  altText?: string;
  timestamp?: any;
  createdAt?: any;
  likes: number; // For compatibility
  likesCount?: number; // Real Firestore count
  comments: number;
  commentsCount?: number; // Real Firestore count
  shares: number;
  commentsList?: PostComment[];
  isLiked?: boolean;
  reactions?: Record<ReactionType, number>;
  userReaction?: ReactionType;
  neuralScore?: number;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content?: string;
  imageUrl?: string;
  timestamp: number;
  duration?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'video-note';
  timestamp: Date;
  isEdited?: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'page';
  participant: User | Group | Page;
  lastMessage?: string;
  unreadCount: number;
}

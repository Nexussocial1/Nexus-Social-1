
import { User, Post, Story } from './types';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const CURRENT_USER: User = {
  id: 'me',
  username: 'alex_dev',
  displayName: 'Alex Rivers',
  email: 'alex@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  bio: 'Building the future of social tech. ✨ React Enthusiast | Design Thinker',
  location: 'Neo-Tokyo Sector 7',
  work: 'Lead Architect @ Synapse Labs',
  school: 'Quantum Engineering Academy',
  nickname: 'The Architect',
  religion: 'Secular Humanist',
  politicalParty: 'Technocrat',
  relationshipStatus: 'Synchronized (Married)',
  followers: 1240,
  following: 850,
  postsCount: 156,
};

export const ALL_MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'u4',
    username: 'code_wizard',
    displayName: 'Merlin Tech',
    email: 'merlin@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Merlin',
    bio: 'Magic with JavaScript. Crafting elegant solutions to complex problems.',
    location: 'Silicon Valley 2.0',
    work: 'Software Enchanter @ GridOS',
    school: 'MIT Neural Dept',
    nickname: 'Spellbinder',
    religion: 'Techno-Pagan',
    politicalParty: 'Futurist',
    relationshipStatus: 'In the Latent Space (Single)',
    followers: 500,
    following: 200,
    postsCount: 42,
  },
  {
    id: 'u5',
    username: 'travel_bug',
    displayName: 'Elena Rossi',
    email: 'elena@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    bio: 'Lost in the right direction. Photographer and world explorer.',
    location: 'Nomadic Hub 01',
    work: 'Visual Chronicler @ Horizon',
    school: 'Florence Arts Institute',
    nickname: 'Nomad',
    religion: 'Zen Buddhist',
    politicalParty: 'Green Party',
    relationshipStatus: 'Single',
    followers: 2100,
    following: 400,
    postsCount: 89,
  },
  {
    id: 'u6',
    username: 'sarah_j',
    displayName: 'Sarah Jenkins',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Marathon runner and coffee lover. ☕🏃‍♀️ Health is wealth!',
    location: 'Central Heights',
    work: 'Bio-Sync Coach',
    school: 'Olympus Sports Science',
    nickname: 'Flash',
    religion: 'Christian',
    politicalParty: 'Liberal',
    relationshipStatus: 'Engaged',
    followers: 3200,
    following: 1100,
    postsCount: 245,
  },
  {
    id: 'u7',
    username: 'marcus_t',
    displayName: 'Marcus Thorne',
    email: 'marcus@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    bio: 'Architect by day, dreamer by night. 🏙️ Exploring structural aesthetics.',
    location: 'Crystal District',
    work: 'Spatial Designer @ Void Arch',
    school: 'Royal Bauhaus of Design',
    nickname: 'Thorne',
    religion: 'Agnostic',
    politicalParty: 'Independent',
    relationshipStatus: 'Married',
    followers: 890,
    following: 450,
    postsCount: 67,
  }
];

export const SUGGESTED_FRIENDS: User[] = ALL_MOCK_USERS.filter(u => u.id !== 'me');

export const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    userId: 'u4',
    userName: 'Merlin Tech',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Merlin',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    content: 'New setup final sync... 💻✨',
    timestamp: Date.now() - 3600000,
    duration: 5000
  },
  {
    id: 's2',
    userId: 'u5',
    userName: 'Elena Rossi',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1000&auto=format&fit=crop',
    content: 'The mountains are calling. 🏔️🌌',
    timestamp: Date.now() - 7200000,
    duration: 5000
  },
  {
    id: 's3',
    userId: 'u6',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop',
    content: 'Morning sweat session done! 🏋️‍♀️',
    timestamp: Date.now() - 10800000,
    duration: 5000
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    userId: 'u6',
    authorName: 'Sarah Jenkins',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Just finished a 10km run this morning! Feeling energized and ready to tackle the week with @marcus_t. 🏃‍♀️💨',
    imageUrl: 'https://images.unsplash.com/photo-1502904550040-753d58f38b8e?q=80&w=1000&auto=format&fit=crop',
    timestamp: '2h ago',
    likes: 42,
    comments: 2,
    shares: 12,
    reactions: { like: 30, love: 12, haha: 0, wow: 0, sad: 0, angry: 0 },
    commentsList: [
      {
        id: 'c1',
        authorId: 'u7',
        authorName: 'Marcus Thorne',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
        content: 'That pace was insane! Great work today.',
        timestamp: '1h ago'
      },
      {
        id: 'c2',
        authorId: 'u4',
        authorName: 'Merlin Tech',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Merlin',
        content: 'Energy optimization successful. ⚡',
        timestamp: '30m ago'
      }
    ]
  },
  {
    id: '2',
    userId: 'u7',
    authorName: 'Marcus Thorne',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    content: 'Check out this amazing view from the office today. Thanks for the inspiration @travel_bug. Sometimes you just have to stop and appreciate the architecture. #citylife',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
    timestamp: '4h ago',
    likes: 128,
    comments: 1,
    shares: 45,
    reactions: { like: 100, love: 20, haha: 5, wow: 3, sad: 0, angry: 0 },
    commentsList: [
      {
        id: 'c3',
        authorId: 'u5',
        authorName: 'Elena Rossi',
        authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
        content: 'The lighting here is phenomenal! 📸',
        timestamp: '2h ago'
      }
    ]
  },
  {
    id: '3',
    userId: 'u4',
    authorName: 'Merlin Tech',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Merlin',
    content: 'Deep into the neural networks today. The latent space is beautiful when you visualize it correctly. @alex_dev should check this out! 🤖🧠',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    timestamp: '6h ago',
    likes: 256,
    comments: 0,
    shares: 89,
    reactions: { like: 200, love: 40, haha: 10, wow: 6, sad: 0, angry: 0 },
    commentsList: []
  }
];

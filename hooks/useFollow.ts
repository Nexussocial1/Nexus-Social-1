import { useState, useEffect, useCallback } from 'react';
import { ALL_MOCK_USERS, CURRENT_USER } from '../constants';
import { User } from '../types';

export const useFollow = (currentUserId: string) => {
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followerIds, setFollowerIds] = useState<string[]>([]);

  const followingKey = `nexus_following_${currentUserId}`;
  const followersKey = `nexus_followers_${currentUserId}`;

  useEffect(() => {
    // Load Following
    const savedFollowing = localStorage.getItem(followingKey);
    if (savedFollowing) {
      setFollowingIds(JSON.parse(savedFollowing));
    } else {
      // For legacy Alex account, provide default follows
      // For truly new accounts, the LoginPage might pre-populate this or leave it empty.
      const initial = currentUserId === 'me' ? ['u4', 'u5'] : [];
      setFollowingIds(initial);
      if (initial.length > 0) {
        localStorage.setItem(followingKey, JSON.stringify(initial));
      }
    }

    // Load Followers (Simulation for the Current User)
    const savedFollowers = localStorage.getItem(followersKey);
    if (savedFollowers) {
      setFollowerIds(JSON.parse(savedFollowers));
    } else {
      // New users start with 0 followers, Alex starts with 3
      const initial = currentUserId === 'me' ? ['u6', 'u7', 'u4'] : [];
      setFollowerIds(initial);
      if (initial.length > 0) {
        localStorage.setItem(followersKey, JSON.stringify(initial));
      }
    }
  }, [followingKey, followersKey, currentUserId]);

  const follow = useCallback((userId: string) => {
    setFollowingIds(prev => {
      if (prev.includes(userId)) return prev;
      const next = [...prev, userId];
      localStorage.setItem(followingKey, JSON.stringify(next));
      return next;
    });
  }, [followingKey]);

  const unfollow = useCallback((userId: string) => {
    setFollowingIds(prev => {
      const next = prev.filter(id => id !== userId);
      localStorage.setItem(followingKey, JSON.stringify(next));
      return next;
    });
  }, [followingKey]);

  const isFollowing = useCallback((userId: string) => {
    return followingIds.includes(userId);
  }, [followingIds]);

  const getFollowingUsers = useCallback(() => {
    return ALL_MOCK_USERS.filter(u => followingIds.includes(u.id));
  }, [followingIds]);

  const getFollowersUsers = useCallback(() => {
    return ALL_MOCK_USERS.filter(u => followerIds.includes(u.id));
  }, [followerIds]);

  return {
    followingIds,
    followerIds,
    follow,
    unfollow,
    isFollowing,
    getFollowingUsers,
    getFollowersUsers,
    followingCount: followingIds.length,
    followerCount: followerIds.length
  };
};

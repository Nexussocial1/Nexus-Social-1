import { useState, useEffect, useCallback } from 'react';
import { Post } from '../types';

export interface ReportState {
  reportedPostIds: string[];
  reportedUserIds: string[];
  savedPostIds: string[];
  notInterestedPostIds: string[];
  mutedUserIds: string[];
}

export const useReport = (currentUserId: string) => {
  const [reportState, setReportState] = useState<ReportState>({
    reportedPostIds: [],
    reportedUserIds: [],
    savedPostIds: [],
    notInterestedPostIds: [],
    mutedUserIds: [],
  });

  const postKey = `nexus_reported_posts_${currentUserId}`;
  const userKey = `nexus_blocked_${currentUserId}`;
  const savedKey = `nexus_saved_posts_${currentUserId}`;
  const savedContentKey = `nexus_saved_content_${currentUserId}`;
  const ignoredKey = `nexus_ignored_posts_${currentUserId}`;
  const mutedKey = `nexus_muted_users_${currentUserId}`;

  const loadState = useCallback(() => {
    const savedReports = localStorage.getItem(postKey);
    const savedBlocks = localStorage.getItem(userKey);
    const savedSaves = localStorage.getItem(savedKey);
    const savedIgnores = localStorage.getItem(ignoredKey);
    const savedMuted = localStorage.getItem(mutedKey);
    
    setReportState({
      reportedPostIds: savedReports ? JSON.parse(savedReports) : [],
      reportedUserIds: savedBlocks ? JSON.parse(savedBlocks) : [],
      savedPostIds: savedSaves ? JSON.parse(savedSaves) : [],
      notInterestedPostIds: savedIgnores ? JSON.parse(savedIgnores) : [],
      mutedUserIds: savedMuted ? JSON.parse(savedMuted) : [],
    });
  }, [postKey, userKey, savedKey, ignoredKey, mutedKey]);

  useEffect(() => {
    loadState();
    window.addEventListener('storage', loadState);
    return () => window.removeEventListener('storage', loadState);
  }, [loadState]);

  const reportPost = useCallback((postId: string) => {
    setReportState(prev => {
      const next = [...new Set([...prev.reportedPostIds, postId])];
      localStorage.setItem(postKey, JSON.stringify(next));
      return { ...prev, reportedPostIds: next };
    });
  }, [postKey]);

  const blockUser = useCallback((userId: string) => {
    setReportState(prev => {
      const next = [...new Set([...prev.reportedUserIds, userId])];
      localStorage.setItem(userKey, JSON.stringify(next));
      return { ...prev, reportedUserIds: next };
    });
  }, [userKey]);

  const unblockUser = useCallback((userId: string) => {
    setReportState(prev => {
      const next = prev.reportedUserIds.filter(id => id !== userId);
      localStorage.setItem(userKey, JSON.stringify(next));
      return { ...prev, reportedUserIds: next };
    });
  }, [userKey]);

  const toggleSavePost = useCallback((post: Post) => {
    // Sanitize post for storage to avoid circular references from SDK class instances
    const sanitizedPost = JSON.parse(JSON.stringify(post, (key, value) => {
      // If we encounter a Firestore Timestamp or similar object with toDate, convert it
      if (value && typeof value === 'object' && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
      }
      return value;
    }));

    setReportState(prev => {
      const isCurrentlySaved = prev.savedPostIds.includes(sanitizedPost.id);
      const nextIds = isCurrentlySaved 
        ? prev.savedPostIds.filter(id => id !== sanitizedPost.id)
        : [...prev.savedPostIds, sanitizedPost.id];
      
      localStorage.setItem(savedKey, JSON.stringify(nextIds));

      const savedContentStr = localStorage.getItem(savedContentKey);
      let savedContent: Post[] = savedContentStr ? JSON.parse(savedContentStr) : [];
      
      if (isCurrentlySaved) {
        savedContent = savedContent.filter(p => p.id !== sanitizedPost.id);
      } else {
        if (!savedContent.find(p => p.id === sanitizedPost.id)) {
          savedContent.push(sanitizedPost);
        }
      }
      localStorage.setItem(savedContentKey, JSON.stringify(savedContent));

      return { ...prev, savedPostIds: nextIds };
    });
  }, [savedKey, savedContentKey]);

  const markNotInterested = useCallback((postId: string) => {
    setReportState(prev => {
      const next = [...new Set([...prev.notInterestedPostIds, postId])];
      localStorage.setItem(ignoredKey, JSON.stringify(next));
      return { ...prev, notInterestedPostIds: next };
    });
  }, [ignoredKey]);

  const muteUser = useCallback((userId: string) => {
    setReportState(prev => {
      const next = [...new Set([...prev.mutedUserIds, userId])];
      localStorage.setItem(mutedKey, JSON.stringify(next));
      return { ...prev, mutedUserIds: next };
    });
  }, [mutedKey]);

  const unmuteUser = useCallback((userId: string) => {
    setReportState(prev => {
      const next = prev.mutedUserIds.filter(id => id !== userId);
      localStorage.setItem(mutedKey, JSON.stringify(next));
      return { ...prev, mutedUserIds: next };
    });
  }, [mutedKey]);

  const isReported = useCallback((id: string) => reportState.reportedPostIds.includes(id) || reportState.reportedUserIds.includes(id), [reportState]);
  const isSaved = useCallback((id: string) => reportState.savedPostIds.includes(id), [reportState]);
  const isIgnored = useCallback((id: string) => reportState.notInterestedPostIds.includes(id), [reportState]);
  const isMuted = useCallback((userId: string) => reportState.mutedUserIds.includes(userId), [reportState]);
  const isBlocked = useCallback((userId: string) => reportState.reportedUserIds.includes(userId), [reportState]);
  
  return {
    reportPost,
    blockUser,
    unblockUser,
    toggleSavePost,
    markNotInterested,
    muteUser,
    unmuteUser,
    isReported,
    isSaved,
    isIgnored,
    isMuted,
    isBlocked,
    reportedPostIds: reportState.reportedPostIds,
    reportedUserIds: reportState.reportedUserIds,
    savedPostIds: reportState.savedPostIds,
    mutedUserIds: reportState.mutedUserIds
  };
};

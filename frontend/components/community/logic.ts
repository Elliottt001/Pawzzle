export type CommunityTab = 'recommend' | 'knowledge' | 'post';
export type UploadType = 'card' | 'update' | 'guide';

export type SearchableCommunityPost = {
  id: string;
  username: string;
  content: string;
  distance: string;
};

type ContentItemLike = {
  id: string;
  title: string;
};

export function getVisibleContentItems<T extends ContentItemLike>(
  activeTab: CommunityTab,
  updates: T[],
  guides: T[]
) {
  if (activeTab === 'knowledge') {
    return guides;
  }

  if (activeTab === 'recommend') {
    return updates;
  }

  return [] as T[];
}

export function filterCommunityPosts<T extends SearchableCommunityPost>(posts: T[], searchText: string) {
  const query = searchText.trim().toLowerCase();
  if (!query) {
    return posts;
  }

  return posts.filter((post) => {
    const haystack = `${post.username} ${post.content} ${post.distance}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function getPublishSubmitLabel(uploadType: UploadType) {
  if (uploadType === 'card') {
    return '发布宠物卡片';
  }

  if (uploadType === 'update') {
    return '发布动态';
  }

  return '发布指南';
}

export function canSubmitContent({
  isLoggedIn,
  uploadType,
  title,
  subtitle,
}: {
  isLoggedIn: boolean;
  uploadType: UploadType;
  title: string;
  subtitle: string;
}) {
  if (!isLoggedIn) {
    return false;
  }

  if (uploadType !== 'update' && uploadType !== 'guide') {
    return false;
  }

  return title.trim().length > 0 && subtitle.trim().length > 0;
}

export function canSubmitCard({
  isLoggedIn,
  name,
  breed,
  age,
  location,
}: {
  isLoggedIn: boolean;
  name: string;
  breed: string;
  age: string;
  location: string;
}) {
  if (!isLoggedIn) {
    return false;
  }

  if (!name.trim() || !breed.trim() || !location.trim()) {
    return false;
  }

  const ageValue = Number(age);
  return age.trim().length > 0 && Number.isFinite(ageValue) && ageValue > 0;
}

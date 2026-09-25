import type { AdminAuditAction, AdminAuditStatus } from './audit';
type Category = 'TECH' | 'BUSINESS';
type Role = 'MEMBER' | 'ADMIN';
type Status = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
type Tag = { id: string; name: string; slug?: string };
type Author = { name: string; photoUrl: string | null };
export type HomePost = {
  id: string; title: string; excerpt: string | null; category: Category; publishedAt: string | null;
  author: Author & { email: string; department: { name: string } | null };
  postTags: { tag: Tag }[]; _count: { likes: number; comments: number };
};
export type HomeMember = {
  id: string; name: string; email: string; jobTitle: string | null; photoUrl: string | null;
  department: { name: string } | null; _count: { posts: number };
};
export type HomeData = {
  stats: { publishedPostCount: number; postingMemberCount: number; departmentCount: number };
  categoryCounts: { TECH: number; BUSINESS: number };
  popularPosts: HomePost[]; latestPosts: HomePost[]; trendingTags: { id: string; name: string; slug: string }[];
  featuredMembers: HomeMember[];
};
export type ActivityArticle = {
  postId: string; title: string; excerpt: string | null; occurredAt: string; note?: string; author: Author;
};
export type ActivityData = { commentedArticles: ActivityArticle[]; likedArticles: ActivityArticle[] };
export type BookmarksData = {
  favoriteUsers: { id: string; name: string; email: string; jobTitle: string | null; photoUrl: string | null;
    status: Status; department: { name: string } | null; createdAt: string }[];
  bookmarks: { createdAt: string; post: { id: string; title: string; excerpt: string | null;
    category: Category; author: Author; postTags: { tag: Tag }[] } }[];
};
type SearchPost<T extends Tag = Tag> = {
  id: string; title: string; excerpt: string | null; category: Category;
  publishedAt: string | null; updatedAt: string; viewCount: number;
  postTags: { tag: T }[]; _count: { likes: number; comments: number };
};
type SearchFilters = { keyword: string; category: string; member: string; memberId: string; tag: string;
  page: number; selectedCategory: Category | '' };
export type SearchData = SearchFilters & (
  | { kind: 'posts'; selectedTag: { id: string; name: string } | null;
      visiblePosts: (SearchPost<Tag & { slug: string }> & { author: { name: string } })[]; hasNextPage: boolean; searchBase: string }
  | { kind: 'members'; members: { id: string; name: string; email: string; jobTitle: string | null;
      bio: string | null; photoUrl: string | null; department: { name: string } | null;
      favoritedBy: { followerId: string }[]; posts: SearchPost[] }[]; hasNextMemberPage: boolean; postCount: number }
);
export type AdminAnalyticsData = {
  totalPostCount: number; totalViewCount: number; publishedPostCount: number; draftPostCount: number;
  archivedPostCount: number; techPostCount: number; businessPostCount: number; likeCount: number;
  commentCount: number; bookmarkCount: number; contributorCount: number;
  dailyPublications: { key: string; label: string; count: number }[];
  topPosts: { id: string; title: string; viewCount: number; author: { name: string };
    _count: { likes: number; comments: number; bookmarks: number } }[];
  topContributors: { id: string; name: string; department: { name: string } | null; _count: { posts: number } }[];
};
export type AdminDashboardData = {
  admin: { id: string }; keyword: string; selectedTab: 'users' | 'analytics'; selectedRole: Role | ''; selectedStatus: Status | '';
  pendingUserCount: number; failedAuditCount: number; filteredUserCount: number; totalUserCount: number;
  activeUserCount: number; suspendedUserCount: number; analytics: AdminAnalyticsData | null;
  users: { id: string; name: string; email: string; role: Role; status: Status; createdAt: string;
    department: { name: string } | null; photoUrl: string | null }[];
};
export type AdminSettingsData = { departments: { id: string; name: string; _count: { members: number } }[] };
export type AuditLogsData = {
  action: AdminAuditAction | ''; status: AdminAuditStatus | '';
  logs: { id: string; adminUserId: string; targetUserId: string; reason: string; errorMessage: string | null;
    createdAt: string; completedAt: string | null; action: AdminAuditAction; status: AdminAuditStatus }[];
  users: { id: string; name: string; email: string }[];
};

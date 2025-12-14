// lib/services/users.client.ts
// Client-side API for user management

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  balance: number;
  createdAt: string;
  lastSignIn: string | null;
}

export interface UserAccess {
  id: number;
  courseId: string;
  packageId: string | null;
  productTitle: string | null;
  grantedAt: string;
}

export interface UserOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  paidAt: string | null;
  itemsCount: number;
}

export interface UsersListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserDetailsResponse {
  user: UserProfile;
  access: UserAccess[];
  orders: UserOrder[];
}

export interface UsersListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
}

export interface ProductOption {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  price: number;
  type: string;
  packages?: { id: string; title: string; price: number }[];
}

export const UsersClient = {
  // Get available products for granting access
  async getProducts(): Promise<ProductOption[]> {
    const res = await fetch('/api/admin/products', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.products || [];
  },

  // Get users list
  async getUsers(params: UsersListParams = {}): Promise<UsersListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params.role) searchParams.set('role', params.role);

    const res = await fetch(`/api/admin/users?${searchParams}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Get user details
  async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    const res = await fetch(`/api/admin/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Update user
  async updateUser(userId: string, data: Partial<UserProfile>): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
  },

  // Update balance
  async updateBalance(
    userId: string, 
    amount: number, 
    type: 'add' | 'subtract' | 'set',
    description?: string
  ): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, type, description }),
    });
    if (!res.ok) throw new Error('Failed to update balance');
  },

  // Grant access
  async grantAccess(
    userId: string,
    courseId: string,
    options?: { packageId?: string; productTitle?: string; reason?: string }
  ): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, ...options }),
    });
    if (!res.ok) throw new Error('Failed to grant access');
  },

  // Revoke access
  async revokeAccess(userId: string, accessId: number): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}/access?accessId=${accessId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to revoke access');
  },
};

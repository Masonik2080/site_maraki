// lib/dao/user.repository.ts
// User operations — server-side only with caching
import 'server-only';
import { cache } from 'react';
import { cacheTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

// === TYPES ===

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  balance: number;
  createdAt: Date;
  lastSignIn: Date | null;
}

export interface UserAccess {
  id: number;
  courseId: string;
  packageId: string | null;
  productTitle: string | null;
  grantedAt: Date;
}

export interface UserOrder {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  paidAt: Date | null;
  itemsCount: number;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'full_name' | 'balance' | 'created_at' | 'email';
  sortOrder?: 'asc' | 'desc';
  role?: string;
}

export interface UserListResult {
  users: UserProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  role?: string;
  balance?: number;
}

export interface GrantAccessInput {
  userId: string;
  courseId: string;
  packageId?: string;
  productTitle?: string;
  grantorId: string;
  reason?: string;
}

// === REPOSITORY ===

export class UserRepository {

  // Get paginated users list with search and sorting
  static async getUsers(params: UserListParams = {}): Promise<UserListResult> {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      role,
    } = params;

    const supabase = getSupabaseAdminClient();

    // Get all auth users first (source of truth)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    
    if (authError || !authData?.users) {
      console.error('[UserRepository] getUsers auth error:', authError);
      return { users: [], total: 0, page, totalPages: 0 };
    }

    let authUsers = authData.users;

    // Search filter by email
    if (search) {
      const searchLower = search.toLowerCase();
      authUsers = authUsers.filter(u => 
        u.email?.toLowerCase().includes(searchLower) ||
        u.user_metadata?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Get profiles for all users
    const userIds = authUsers.map(u => u.id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    const profileMap = new Map<string, any>();
    for (const p of profiles || []) {
      profileMap.set(p.user_id, p);
    }

    // Merge auth users with profiles
    let users: UserProfile[] = authUsers.map(authUser => {
      const profile = profileMap.get(authUser.id);
      return {
        id: profile?.id || authUser.id,
        userId: authUser.id,
        email: authUser.email || '',
        fullName: profile?.full_name || authUser.user_metadata?.full_name || null,
        username: profile?.username || null,
        avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
        role: profile?.role || 'user',
        balance: profile?.balance || 0,
        createdAt: new Date(authUser.created_at),
        lastSignIn: authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null,
      };
    });

    // Role filter
    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Sorting
    users.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
          break;
        case 'full_name':
          aVal = a.fullName || '';
          bVal = b.fullName || '';
          break;
        case 'balance':
          aVal = a.balance;
          bVal = b.balance;
          break;
        default:
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    
    // Pagination
    const offset = (page - 1) * limit;
    users = users.slice(offset, offset + limit);

    return { users, total, page, totalPages };
  }

  // Get single user by ID
  static async getUserById(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    // Get email from auth.users
    let email = '';
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    if (authUser?.user?.email) {
      email = authUser.user.email;
    }

    return {
      id: data.id,
      userId: data.user_id,
      email,
      fullName: data.full_name,
      username: data.username,
      avatarUrl: data.avatar_url,
      role: data.role || 'user',
      balance: data.balance || 0,
      createdAt: new Date(data.updated_at || Date.now()),
      lastSignIn: authUser?.user?.last_sign_in_at ? new Date(authUser.user.last_sign_in_at) : null,
    };
  }

  // Update user profile
  static async updateUser(userId: string, input: UpdateUserInput): Promise<boolean> {
    const supabase = getSupabaseAdminClient();

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (input.fullName !== undefined) updates.full_name = input.fullName;
    if (input.username !== undefined) updates.username = input.username;
    if (input.role !== undefined) updates.role = input.role;
    if (input.balance !== undefined) updates.balance = input.balance;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);

    return !error;
  }

  // Get user's course access
  static async getUserAccess(userId: string): Promise<UserAccess[]> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('user_course_access')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      courseId: row.course_id,
      packageId: row.package_id,
      productTitle: row.product_title,
      grantedAt: new Date(row.granted_at),
    }));
  }

  // Grant course access
  static async grantAccess(input: GrantAccessInput): Promise<boolean> {
    const supabase = getSupabaseAdminClient();

    // Check existing access
    const { data: existing } = await supabase
      .from('user_course_access')
      .select('id')
      .eq('user_id', input.userId)
      .eq('course_id', input.courseId)
      .maybeSingle();

    if (existing) return true; // Already has access

    // Grant access
    const { error: accessError } = await supabase
      .from('user_course_access')
      .insert({
        user_id: input.userId,
        course_id: input.courseId,
        package_id: input.packageId || null,
        product_title: input.productTitle || null,
      });

    if (accessError) return false;

    // Log access grant
    await supabase.from('access_log').insert({
      user_id: input.userId,
      product_id_external: input.courseId,
      product_type: 'course',
      action: 'grant',
      grantor_type: 'admin',
      grantor_id: input.grantorId,
      reason: input.reason || 'Manual grant by admin',
    });

    return true;
  }

  // Revoke course access
  static async revokeAccess(userId: string, accessId: number, adminId: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();

    // Get access info before delete
    const { data: access } = await supabase
      .from('user_course_access')
      .select('*')
      .eq('id', accessId)
      .single();

    if (!access) return false;

    // Delete access
    const { error } = await supabase
      .from('user_course_access')
      .delete()
      .eq('id', accessId);

    if (error) return false;

    // Log revoke
    await supabase.from('access_log').insert({
      user_id: userId,
      product_id_external: access.course_id,
      product_type: 'course',
      action: 'revoke',
      grantor_type: 'admin',
      grantor_id: adminId,
      reason: 'Revoked by admin',
    });

    return true;
  }

  // Get user orders
  static async getUserOrders(userId: string): Promise<UserOrder[]> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        paid_at,
        order_items (id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      status: row.status,
      total: row.total_amount,
      createdAt: new Date(row.created_at),
      paidAt: row.paid_at ? new Date(row.paid_at) : null,
      itemsCount: row.order_items?.length || 0,
    }));
  }

  // Update user balance
  static async updateBalance(
    userId: string, 
    amount: number, 
    type: 'add' | 'subtract' | 'set',
    description?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdminClient();

    // Get current balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!profile) return false;

    let newBalance: number;
    switch (type) {
      case 'add':
        newBalance = (profile.balance || 0) + amount;
        break;
      case 'subtract':
        newBalance = (profile.balance || 0) - amount;
        break;
      case 'set':
        newBalance = amount;
        break;
    }

    // Update balance
    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (error) return false;

    // Log balance change
    await supabase.from('balance_history').insert({
      user_id: userId,
      type: type === 'add' ? 'credit' : type === 'subtract' ? 'debit' : 'adjustment',
      amount: type === 'set' ? newBalance - (profile.balance || 0) : amount,
      description: description || `Balance ${type} by admin`,
    });

    return true;
  }

  // Get user profile with caching
  static async getProfile(userId: string): Promise<UserProfile | null> {
    'use cache';
    cacheTag(`user-profile:${userId}`);
    
    return UserRepository.getUserById(userId);
  }
  
  // Invalidate user cache after updates
  static async invalidateUserCache(userId: string): Promise<void> {
    const { updateTag } = await import('next/cache');
    updateTag(`user-profile:${userId}`);
    updateTag(`user-courses:${userId}`);
    updateTag(`user-orders:${userId}`);
  }

  // Get available roles
  static async getRoles(): Promise<{ id: string; name: string; displayName: string }[]> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('roles')
      .select('id, name, display_name')
      .order('name');

    if (error || !data) {
      // Return default roles if table doesn't exist or is empty
      return [
        { id: '1', name: 'user', displayName: 'Пользователь' },
        { id: '2', name: 'admin', displayName: 'Администратор' },
      ];
    }

    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      displayName: r.display_name,
    }));
  }
}

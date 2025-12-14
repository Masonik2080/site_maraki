// lib/dao/payment-link.repository.ts
// Repository для работы с платёжными ссылками — server-side only
import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

// ============ TYPES ============
export type PaymentLinkStatus = 'active' | 'expired' | 'exhausted' | 'disabled';
export type UsageType = 'single' | 'limited' | 'unlimited';
export type PaymentLinkPaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface PaymentLink {
  id: string;
  code: string;
  amount: number;
  description: string;
  allowSbp: boolean;
  allowCard: boolean;
  allowTpay: boolean;
  requiresAuth: boolean;
  usageType: UsageType;
  maxUses: number | null;
  currentUses: number;
  expiresAt: Date | null;
  status: PaymentLinkStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentLinkPayment {
  id: string;
  linkId: string;
  userId: string | null;
  contactInfo: string | null;
  contactType: string | null;
  providerPaymentId: string | null;
  paymentMethod: string | null;
  status: PaymentLinkPaymentStatus;
  createdAt: Date;
  paidAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface CreatePaymentLinkInput {
  amount: number;
  description: string;
  allowSbp?: boolean;
  allowCard?: boolean;
  allowTpay?: boolean;
  requiresAuth?: boolean;
  usageType: UsageType;
  maxUses?: number;
  expiresAt?: Date;
  createdBy: string;
}

export interface CreatePaymentInput {
  linkId: string;
  userId?: string;
  contactInfo?: string;
  contactType?: string;
}


// ============ REPOSITORY ============
export class PaymentLinkRepository {
  
  // Генерация уникального короткого кода
  private static generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих символов
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Создание ссылки
  static async create(input: CreatePaymentLinkInput): Promise<PaymentLink | null> {
    const supabase = getSupabaseAdminClient();
    
    // Генерируем уникальный код
    let code = this.generateCode();
    let attempts = 0;
    
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('payment_links')
        .select('id')
        .eq('code', code)
        .single();
      
      if (!existing) break;
      code = this.generateCode();
      attempts++;
    }
    
    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        code,
        amount: input.amount,
        description: input.description,
        allow_sbp: input.allowSbp ?? true,
        allow_card: input.allowCard ?? true,
        allow_tpay: input.allowTpay ?? true,
        requires_auth: input.requiresAuth ?? false,
        usage_type: input.usageType,
        max_uses: input.usageType === 'limited' ? input.maxUses : null,
        expires_at: input.expiresAt?.toISOString() ?? null,
        created_by: input.createdBy,
        status: 'active',
      })
      .select()
      .single();
    
    if (error || !data) {
      console.error('[PaymentLinkRepository] Create error:', error);
      return null;
    }
    
    return this.mapToPaymentLink(data);
  }

  // Получение по коду
  static async getByCode(code: string): Promise<PaymentLink | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error || !data) return null;
    
    return this.mapToPaymentLink(data);
  }

  // Получение по ID
  static async getById(id: string): Promise<PaymentLink | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return this.mapToPaymentLink(data);
  }

  // Получение всех ссылок (для админки)
  static async getAll(): Promise<PaymentLink[]> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(this.mapToPaymentLink);
  }

  // Проверка доступности ссылки
  static async checkAvailability(code: string): Promise<{ available: boolean; reason?: string; link?: PaymentLink }> {
    const link = await this.getByCode(code);
    
    if (!link) {
      return { available: false, reason: 'Ссылка не найдена' };
    }
    
    if (link.status === 'disabled') {
      return { available: false, reason: 'Ссылка отключена' };
    }
    
    if (link.status === 'expired') {
      return { available: false, reason: 'Срок действия ссылки истёк' };
    }
    
    if (link.status === 'exhausted') {
      return { available: false, reason: 'Лимит использований исчерпан' };
    }
    
    // Проверяем срок действия
    if (link.expiresAt && new Date() > link.expiresAt) {
      await this.updateStatus(link.id, 'expired');
      return { available: false, reason: 'Срок действия ссылки истёк' };
    }
    
    // Проверяем лимит использований
    if (link.usageType === 'single' && link.currentUses >= 1) {
      await this.updateStatus(link.id, 'exhausted');
      return { available: false, reason: 'Ссылка уже использована' };
    }
    
    if (link.usageType === 'limited' && link.maxUses && link.currentUses >= link.maxUses) {
      await this.updateStatus(link.id, 'exhausted');
      return { available: false, reason: 'Лимит использований исчерпан' };
    }
    
    return { available: true, link };
  }

  // Обновление статуса
  static async updateStatus(id: string, status: PaymentLinkStatus): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const { error } = await supabase
      .from('payment_links')
      .update({ status })
      .eq('id', id);
    
    return !error;
  }

  // Инкремент использований
  static async incrementUses(id: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    // Пробуем RPC (если функция существует в БД)
    const { error: rpcError } = await supabase.rpc('increment_payment_link_uses', { link_id: id });
    
    if (!rpcError) {
      console.log('[PaymentLinkRepository] Incremented uses via RPC for link:', id);
      return true;
    }
    
    // Fallback: читаем текущее значение и обновляем
    console.log('[PaymentLinkRepository] RPC not available, using fallback. Error:', rpcError.message);
    
    const link = await this.getById(id);
    if (!link) {
      console.error('[PaymentLinkRepository] Link not found for increment:', id);
      return false;
    }
    
    const newUses = link.currentUses + 1;
    
    const { error: updateError } = await supabase
      .from('payment_links')
      .update({ current_uses: newUses })
      .eq('id', id);
    
    if (updateError) {
      console.error('[PaymentLinkRepository] Failed to increment uses:', updateError);
      return false;
    }
    
    console.log('[PaymentLinkRepository] Incremented uses for link:', id, 'new value:', newUses);
    return true;
  }

  // Удаление ссылки
  static async delete(id: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const { error } = await supabase
      .from('payment_links')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // ============ PAYMENTS ============

  // Получение платежа по ID
  static async getPaymentById(id: string): Promise<PaymentLinkPayment | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('payment_link_payments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return this.mapToPayment(data);
  }

  // Создание записи об оплате
  static async createPayment(input: CreatePaymentInput): Promise<PaymentLinkPayment | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('payment_link_payments')
      .insert({
        link_id: input.linkId,
        user_id: input.userId ?? null,
        contact_info: input.contactInfo ?? null,
        contact_type: input.contactType ?? null,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error || !data) {
      console.error('[PaymentLinkRepository] CreatePayment error:', error);
      return null;
    }
    
    return this.mapToPayment(data);
  }

  // Обновление платежа
  static async updatePayment(
    id: string, 
    updates: Partial<{
      providerPaymentId: string;
      paymentMethod: string;
      status: PaymentLinkPaymentStatus;
      paidAt: Date;
    }>
  ): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const dbUpdates: Record<string, unknown> = {};
    if (updates.providerPaymentId) dbUpdates.provider_payment_id = updates.providerPaymentId;
    if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.paidAt) dbUpdates.paid_at = updates.paidAt.toISOString();
    
    const { error } = await supabase
      .from('payment_link_payments')
      .update(dbUpdates)
      .eq('id', id);
    
    return !error;
  }

  // Получение платежей по ссылке
  static async getPaymentsByLinkId(linkId: string): Promise<PaymentLinkPayment[]> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('payment_link_payments')
      .select('*')
      .eq('link_id', linkId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(this.mapToPayment);
  }

  // ============ MAPPERS ============

  private static mapToPaymentLink(data: any): PaymentLink {
    return {
      id: data.id,
      code: data.code,
      amount: parseFloat(data.amount),
      description: data.description,
      allowSbp: data.allow_sbp,
      allowCard: data.allow_card,
      allowTpay: data.allow_tpay,
      requiresAuth: data.requires_auth,
      usageType: data.usage_type as UsageType,
      maxUses: data.max_uses,
      currentUses: data.current_uses,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      status: data.status as PaymentLinkStatus,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private static mapToPayment(data: any): PaymentLinkPayment {
    return {
      id: data.id,
      linkId: data.link_id,
      userId: data.user_id,
      contactInfo: data.contact_info,
      contactType: data.contact_type,
      providerPaymentId: data.provider_payment_id,
      paymentMethod: data.payment_method,
      status: data.status as PaymentLinkPaymentStatus,
      createdAt: new Date(data.created_at),
      paidAt: data.paid_at ? new Date(data.paid_at) : null,
      metadata: data.metadata || {},
    };
  }
}

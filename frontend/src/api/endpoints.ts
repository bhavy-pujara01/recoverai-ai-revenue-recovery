import { apiClient } from './client';
import {
  User,
  Transaction,
  Customer,
  RecoveryCampaign,
  Notification,
  AuditLog,
  AnalyticsData,
  OrgSettings,
} from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/login', credentials);
    return res.data;
  },
  demoLogin: async (role: 'ADMIN' | 'ANALYST' | 'SUPPORT') => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/demo-login', { role });
    return res.data;
  },
  register: async (payload: { name: string; email: string; password: string; organizationName: string }) => {
    const res = await apiClient.post<{ success: boolean; token: string; user: User }>('/auth/register', payload);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return res.data.user;
  },
};

export const transactionsApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Transaction[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/transactions', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Transaction }>('/transactions/' + id);
    return res.data.data;
  },
  generateRecommendation: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; data: any }>('/transactions/' + id + '/recommendation');
    return res.data.data;
  },
  executeRecovery: async (id: string, payload: { channel?: string; actionType?: string; forceSuccess?: boolean }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: { success: boolean; transaction: Transaction } }>(
      '/transactions/' + id + '/recover',
      payload
    );
    return res.data;
  },
  batchRecover: async (payload: { transactionIds: string[]; channel?: string; actionType?: string }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      summary: { total: number; recoveredCount: number; recoveredAmount: number };
    }>('/transactions/batch-recover', payload);
    return res.data;
  },
  updateStatus: async (id: string, payload: { status: string; note?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: Transaction; message: string }>(
      '/transactions/' + id + '/status',
      payload
    );
    return res.data;
  },
  simulate: async (payload: {
    customerId?: string;
    amount?: number;
    failureCategory?: string;
    failureReason?: string;
    paymentMethod?: string;
    cardIssuer?: string;
    upiApp?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: Transaction }>('/transactions/simulate', payload);
    return res.data.data;
  },
};

export const customersApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Customer[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/customers', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Customer }>('/customers/' + id);
    return res.data.data;
  },
};

export const campaignsApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{ success: boolean; data: RecoveryCampaign[] }>('/campaigns', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: RecoveryCampaign }>('/campaigns/' + id);
    return res.data.data;
  },
  create: async (payload: Partial<RecoveryCampaign>) => {
    const res = await apiClient.post<{ success: boolean; data: RecoveryCampaign }>('/campaigns', payload);
    return res.data.data;
  },
  launch: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: RecoveryCampaign }>('/campaigns/' + id + '/launch');
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<{ success: boolean; data: RecoveryCampaign }>('/campaigns/' + id + '/status', { status });
    return res.data.data;
  },
};

export const analyticsApi = {
  getOverview: async (timeRange = '30d') => {
    const res = await apiClient.get<{ success: boolean; data: AnalyticsData }>('/analytics/overview', {
      params: { timeRange },
    });
    return res.data.data;
  },
};

export const notificationsApi = {
  list: async (unreadOnly = false) => {
    const res = await apiClient.get<{ success: boolean; data: Notification[]; unreadCount: number }>('/notifications', {
      params: { unreadOnly },
    });
    return res.data;
  },
  markRead: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; data: Notification }>('/notifications/' + id + '/read');
    return res.data.data;
  },
  markAllRead: async () => {
    const res = await apiClient.post<{ success: boolean; message: string }>('/notifications/read-all');
    return res.data;
  },
};

export const auditApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<{
      success: boolean;
      data: AuditLog[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/audit', { params });
    return res.data;
  },
};

export const settingsApi = {
  get: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: { organization: any; settings: OrgSettings; users: User[] };
    }>('/settings');
    return res.data.data;
  },
  update: async (payload: any) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: OrgSettings }>('/settings', payload);
    return res.data;
  },
  regenerateWebhookSecret: async () => {
    const res = await apiClient.post<{ success: boolean; webhookSecret: string; message: string }>(
      '/settings/webhook-secret/regenerate'
    );
    return res.data;
  },
  inviteMember: async (payload: { name: string; email: string; role: string; password?: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: User }>('/settings/team/invite', payload);
    return res.data;
  },
};

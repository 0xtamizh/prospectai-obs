export interface Interaction {
  id: string;
  org_id: string;
  user_id: string;
  agent_id: string;
  contact_id: string;
  action: string;
  type: string;
  subject: string;
  body: string;
  email_id?: string;
  thread_id?: string;
  used_account?: string;
  status: string;
  created_at: string;
  updated_at: string;
  interaction_info: any;
  description: string;
  estimated_cost?: number;
  llm_metrics?: {
    tokens_used?: number;
    model?: string;
    latency?: number;
  };
}

export interface FilterOptions {
  orgId?: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface EntityCache {
  users: Record<string, UserInfo>;
  organizations: Record<string, OrgInfo>;
  agents: Record<string, AgentInfo>;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  org_id: string;
}

export interface OrgInfo {
  id: string;
  name: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
}

export const DATE_RANGE_OPTIONS = [
  { label: 'Last 1 hour', value: 'hour' },
  { label: 'Last 8 hours', value: '8hours' },
  { label: 'Last 24 hours', value: 'day' },
  { label: 'Last 3 days', value: '3days' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'Last 14 days', value: '2weeks' },
  { label: 'Last 30 days', value: 'month' },
  { label: 'Last 3 months', value: '3months' },
  { label: 'Last 6 months', value: '6months' },
  { label: 'Last 1 year', value: 'year' }
];
export interface QueueItem {
  id: string;
  contact_id: string;
  org_id: string;
  user_id: string;
  agent_id: string;
  email: string;
  first_name: string;
  last_name: string;
  action: string;
  type: string;
  status: string;
  created_at: string;
  last_interaction_on: string | null;
  company_name: string;
  job_title: string;
  decision: {
    type: string;
    action: string[];
    reasoning: string;
    description: string;
  } | null;
}

export interface QueueStats {
  total: number;
  byUser: Record<string, {
    pending: number;
    active: number;
    completed: number;
    total: number;
    user: {
      name: string;
      email: string;
    };
  }>;
  lastFetchTime: Date | null;
}

export interface QueueUserGroup {
  userId: string;
  userName: string;
  userEmail: string;
  items: QueueItem[];
  stats: {
    pending: number;
    active: number;
    completed: number;
    total: number;
  };
}
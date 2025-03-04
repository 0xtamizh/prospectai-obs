import { supabase } from './supabase';
import { EntityCache, UserInfo, OrgInfo, AgentInfo } from '../types/interaction';

class EntityCacheManager {
  private static instance: EntityCacheManager;
  private cache: EntityCache = {
    users: {},
    organizations: {},
    agents: {}
  };
  private lastFetchTime: Date | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  private constructor() {}

  public static getInstance(): EntityCacheManager {
    if (!EntityCacheManager.instance) {
      EntityCacheManager.instance = new EntityCacheManager();
    }
    return EntityCacheManager.instance;
  }

  private isCacheValid(): boolean {
    if (!this.lastFetchTime) return false;
    const now = new Date();
    return now.getTime() - this.lastFetchTime.getTime() < this.CACHE_DURATION;
  }

  public async initializeCache(): Promise<void> {
    if (this.isCacheValid()) return;

    try {
      // Fetch organizations
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1000);

      if (orgs) {
        this.cache.organizations = orgs.reduce((acc, org) => ({
          ...acc,
          [org.id]: { id: org.id, name: org.name }
        }), {});
      }

      // Fetch users with org_id
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, org_id')
        .limit(1000);

      if (users) {
        this.cache.users = users.reduce((acc, user) => ({
          ...acc,
          [user.id]: { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            org_id: user.org_id 
          }
        }), {});
      }

      // Fetch agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id, name, type')
        .limit(1000);

      if (agents) {
        this.cache.agents = agents.reduce((acc, agent) => ({
          ...acc,
          [agent.id]: { id: agent.id, name: agent.name, type: agent.type }
        }), {});
      }

      this.lastFetchTime = new Date();
    } catch (error) {
      console.error('Error initializing entity cache:', error);
    }
  }

  public getUser(id: string): UserInfo | undefined {
    return this.cache.users[id];
  }

  public getOrg(id: string): OrgInfo | undefined {
    return this.cache.organizations[id];
  }

  public getAgent(id: string): AgentInfo | undefined {
    return this.cache.agents[id];
  }

  public getAllUsers(): Record<string, UserInfo> {
    return this.cache.users;
  }

  public getUsersByOrg(orgId?: string): Record<string, UserInfo> {
    if (!orgId) return {};
    return Object.values(this.cache.users).reduce((acc, user) => {
      if (user.org_id === orgId) {
        acc[user.id] = user;
      }
      return acc;
    }, {} as Record<string, UserInfo>);
  }

  public getAllOrgs(): Record<string, OrgInfo> {
    return this.cache.organizations;
  }

  public getAllAgents(): Record<string, AgentInfo> {
    return this.cache.agents;
  }

  public clearCache(): void {
    this.cache = {
      users: {},
      organizations: {},
      agents: {}
    };
    this.lastFetchTime = null;
  }
}

export const entityCache = EntityCacheManager.getInstance();
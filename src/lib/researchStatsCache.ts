import { supabase } from './supabase';
import { ResearchStats, ResearchStatsCache } from '../types/research';

class ResearchStatsCacheManager {
  private static instance: ResearchStatsCacheManager;
  private cache: ResearchStatsCache = {
    previousStats: null,
    currentStats: null
  };
  private readonly STORAGE_KEY = 'researchStatsCache';

  private constructor() {
    // Load cache from localStorage
    const savedCache = localStorage.getItem(this.STORAGE_KEY);
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        // Convert date strings back to Date objects
        if (parsed.currentStats?.lastFetchTime) {
          parsed.currentStats.lastFetchTime = new Date(parsed.currentStats.lastFetchTime);
        }
        if (parsed.previousStats?.lastFetchTime) {
          parsed.previousStats.lastFetchTime = new Date(parsed.previousStats.lastFetchTime);
        }
        this.cache = parsed;
      } catch (error) {
        console.error('Error parsing saved cache:', error);
        this.clearCache();
      }
    }
  }

  public static getInstance(): ResearchStatsCacheManager {
    if (!ResearchStatsCacheManager.instance) {
      ResearchStatsCacheManager.instance = new ResearchStatsCacheManager();
    }
    return ResearchStatsCacheManager.instance;
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }

  public async fetchStats(forceRefresh: boolean = false): Promise<ResearchStats> {
    try {
      // Store current stats as previous before fetching new ones
      if (this.cache.currentStats) {
        this.cache.previousStats = { ...this.cache.currentStats };
      }

      // Fetch contacts stats with proper error handling
      const contactsPromise = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      const researchedContactsPromise = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('researched', true);

      const websitesPromise = supabase
        .from('websites')
        .select('*', { count: 'exact', head: true });

      const linkedinProfilesPromise = supabase
        .from('linkedin_profiles')
        .select('*', { count: 'exact', head: true });

      const companyProfilesPromise = supabase
        .from('company_profiles')
        .select('*', { count: 'exact', head: true });

      const [
        { count: totalContacts },
        { count: researchedContacts },
        { count: totalWebsites },
        { count: totalLinkedinProfiles },
        { count: totalCompanyProfiles }
      ] = await Promise.all([
        contactsPromise,
        researchedContactsPromise,
        websitesPromise,
        linkedinProfilesPromise,
        companyProfilesPromise
      ]);

      const currentStats: ResearchStats = {
        contacts: {
          total: totalContacts || 0,
          researched: researchedContacts || 0,
          newSinceLastFetch: 0,
          newResearchedSinceLastFetch: 0
        },
        websites: {
          total: totalWebsites || 0,
          newSinceLastFetch: 0
        },
        linkedinProfiles: {
          total: totalLinkedinProfiles || 0,
          newSinceLastFetch: 0
        },
        companyProfiles: {
          total: totalCompanyProfiles || 0,
          newSinceLastFetch: 0
        },
        lastFetchTime: new Date()
      };

      // Calculate differences if we have previous stats
      if (this.cache.previousStats) {
        currentStats.contacts.newSinceLastFetch = 
          Math.max(0, currentStats.contacts.total - this.cache.previousStats.contacts.total);
        currentStats.contacts.newResearchedSinceLastFetch = 
          Math.max(0, currentStats.contacts.researched - this.cache.previousStats.contacts.researched);
        currentStats.websites.newSinceLastFetch = 
          Math.max(0, currentStats.websites.total - this.cache.previousStats.websites.total);
        currentStats.linkedinProfiles.newSinceLastFetch = 
          Math.max(0, currentStats.linkedinProfiles.total - this.cache.previousStats.linkedinProfiles.total);
        currentStats.companyProfiles.newSinceLastFetch = 
          Math.max(0, currentStats.companyProfiles.total - this.cache.previousStats.companyProfiles.total);
      }

      this.cache.currentStats = currentStats;
      this.saveToLocalStorage();
      return currentStats;
    } catch (error) {
      console.error('Error fetching research stats:', error);
      throw error;
    }
  }

  public clearCache(): void {
    this.cache = {
      previousStats: null,
      currentStats: null
    };
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const researchStatsCache = ResearchStatsCacheManager.getInstance();
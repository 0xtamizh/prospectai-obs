export interface ResearchStats {
  contacts: {
    total: number;
    researched: number;
    newSinceLastFetch: number;
    newResearchedSinceLastFetch: number;
  };
  websites: {
    total: number;
    newSinceLastFetch: number;
  };
  linkedinProfiles: {
    total: number;
    newSinceLastFetch: number;
  };
  companyProfiles: {
    total: number;
    newSinceLastFetch: number;
  };
  lastFetchTime: Date | null;
}

export interface ResearchStatsCache {
  previousStats: ResearchStats | null;
  currentStats: ResearchStats | null;
}
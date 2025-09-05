export interface SingleAnalyzeRequest {
  comment_text: string;
}

export interface SingleAnalyzeResponse {
  code: number;
  msg: string;
  data: {
    id: number;
    comment_text: string;
    hzsystem_sentiment: string;
    confidence: number;
    keywords: string[];
    probabilities: {
      negative: number;
      positive: number;
    };
    created_at: string;
  };
}

export interface BatchAnalyzeRequest {
  file: File;
  comment_column?: string;
}

export interface BatchAnalyzeResponse {
  code: number;
  msg: string;
  data: {
    id: number;
    file_name: string;
    statistics: {
      total_count: number;
      positive_count: number;
      negative_count: number;
      neutral_count: number;
      positive_ratio: number;
      negative_ratio: number;
      neutral_ratio: number;
    };
    preview_results: {
      hzsystem_sentiment: string;
      confidence: number;
      keywords: string[];
      probabilities: {
        negative: number;
        positive: number;
      };
      comment_text: string;
      row_index: number;
    }[];
    created_at: string;
  };
}

export interface HistoryRecord {
  id: number;
  username: string;
  analysis_type: string;
  created_at: string;
  updated_at: string;
  file_name: string | null;
  total_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  comment_text: string | null;
  sentiment: string;
  confidence: number;
  keywords: string[];
  details: any[];
}

export interface GetHistoryRequest {
  page?: number;
  page_size?: number;
  hzsystem_sentiment?: 'negative' | 'positive' | 'neutral';
  start_date?: string;
  end_date?: string;
}

export interface GetHistoryResponse {
  code: number;
  msg: string | null;
  data: {
    total: number;
    page: number;
    page_size: number;
    records: HistoryRecord[];
  };
}

export interface GetDetailResponse {
  code: number;
  msg: string | null;
  data: HistoryRecord;
}

export interface GetStatisticsResponse {
  code: number;
  msg: string | null;
  data: {
    total_analyses: number;
    single_analyses: number;
    batch_analyses: number;
    total_comments_analyzed: number;
    sentiment_distribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    recent_analyses: {
      id: number;
      analysis_type: string;
      created_at: string;
      total_count: number;
      sentiment: string;
    }[];
  };
}

export interface DeleteRecordRequest {
  record_id: number;
}

export interface DeleteRecordResponse {
  code: number;
  msg: string;
  data: null;
}
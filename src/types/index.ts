export interface TgObject {
  labels: string;
  numeric_id: number;
  username?: string;
  meta: Record<string, any>;
  is_private: boolean;
  status?: 'verified' | 'scam' | 'fake' | 'normal' | 'is_deleted';
  created_at: string;
  updated_at: string;
  access_hash?: number;
}

export interface TelegramMessage {
  labels: string;
  numeric_id: number;
  msg_id: number;
  account_id?: string;
  author_is_bot: boolean;
  media?: string;
  views?: number;
  forwards?: number;
  reactions?: Record<string, any>;
  reactions_text?: string;
  comments_count?: number;
  comments_list?: Record<string, any>;
  date: string;
  text_markdown?: string;
  text_clean?: string;
  formatted_body?: string;
  body?: string;
  text_string?: string;
  external_url?: string;
  created_at: string;
  updated_at: string;
  diagnostics: Record<string, any>;
  email_addresses?: Record<string, any>;
  tg_links?: Record<string, any>;
  www_links?: Record<string, any>;
  mentions?: Record<string, any>;
  hashtags?: Record<string, any>;
  phone_numbers?: Record<string, any>;
  intense_words?: Record<string, any>;
  questions?: Record<string, any>;
  exclamations?: Record<string, any>;
  emojis?: Record<string, any>;
  topic_category?: string;
}

export interface ExtractorSession {
  session_name: string;
  list: string[];
  is_full: boolean;
  max_items: number;
  created_at: string;
  updated_at: string;
  last_fill_at?: string;
  last_drained_at?: string;
}

export interface ExtractorPushLog {
  username: string;
  last_enqueued_at: string;
}

export interface TableResponse<T> {
  rows: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface TableFilters {
  search?: string;
  search_questions?: string;
  search_emails?: string;
  search_tg_links?: string;
  search_www_links?: string;
  search_mentions?: string;
  search_hashtags?: string;
  search_phones?: string;
  search_intense_words?: string;
  search_exclamations?: string;
  search_emojis?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      watchlist_groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      watchlist_items: {
        Row: {
          id: string;
          group_id: string;
          symbol: string;
          market: string;
          name: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          symbol: string;
          market: string;
          name?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          symbol?: string;
          market?: string;
          name?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      drawings: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          timeframe: string;
          type: string;
          data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          timeframe: string;
          type: string;
          data: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          timeframe?: string;
          type?: string;
          data?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          name: string | null;
          conditions: Json;
          enabled: boolean;
          notify_telegram: boolean;
          last_triggered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          name?: string | null;
          conditions: Json;
          enabled?: boolean;
          notify_telegram?: boolean;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          name?: string | null;
          conditions?: Json;
          enabled?: boolean;
          notify_telegram?: boolean;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      alert_history: {
        Row: {
          id: string;
          alert_id: string;
          triggered_at: string;
          message: string | null;
        };
        Insert: {
          id?: string;
          alert_id: string;
          triggered_at?: string;
          message?: string | null;
        };
        Update: {
          id?: string;
          alert_id?: string;
          triggered_at?: string;
          message?: string | null;
        };
      };
    };
  };
}

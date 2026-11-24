export type ClubRole = "propietario" | "gerente" | "cajero" | "cocina" | "entrenador" | "organizador";

export type CatalogItemType = "servicio" | "producto";

export type CatalogCategoryKey =
  | "renta_cancha"
  | "participacion_reta"
  | "clases"
  | "bar_cocina"
  | "accesorios";

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          timezone?: string;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      club_settings: {
        Row: {
          id: string;
          club_id: string;
          contact_phone: string | null;
          contact_email: string | null;
          address: string | null;
          opening_hours: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          contact_phone?: string | null;
          contact_email?: string | null;
          address?: string | null;
          opening_hours?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_phone?: string | null;
          contact_email?: string | null;
          address?: string | null;
          opening_hours?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      club_memberships: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: ClubRole;
          display_name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          role: ClubRole;
          display_name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: ClubRole;
          display_name?: string;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          phone: string | null;
          normalized_phone: string | null;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          phone?: string | null;
          normalized_phone?: string | null;
          notes?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          phone?: string | null;
          normalized_phone?: string | null;
          notes?: string | null;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      courts: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          number: number;
          surface: string | null;
          description: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          number: number;
          surface?: string | null;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          number?: number;
          surface?: string | null;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalog_categories: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          key: CatalogCategoryKey;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          key: CatalogCategoryKey;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalog_items: {
        Row: {
          id: string;
          club_id: string;
          category_id: string;
          name: string;
          type: CatalogItemType;
          price_cents: number;
          available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          category_id: string;
          name: string;
          type: CatalogItemType;
          price_cents: number;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: CatalogItemType;
          price_cents?: number;
          available?: boolean;
          category_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          club_id: string;
          actor_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          before: Record<string, unknown> | null;
          after: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          actor_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          entity_type?: string;
          entity_id?: string;
          action?: string;
        };
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: never };
  };
}

export type ClubRole = "propietario" | "gerente" | "cajero" | "cocina" | "entrenador" | "organizador";

export type CatalogItemType = "servicio" | "producto";
export type BookingType = "reserva" | "bloqueo";
export type BookingStatus = "activa" | "cancelada";

export type CatalogCategoryKey =
  | "renta_cancha"
  | "participacion_reta"
  | "clases"
  | "bar_cocina"
  | "accesorios";

export interface Database {
  public: {
    Tables: {
      club_settings: {
        Row: {
          id: string;
          name: string;
          contact_phone: string | null;
          contact_email: string | null;
          address: string | null;
          opening_hours: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          contact_phone?: string | null;
          contact_email?: string | null;
          address?: string | null;
          opening_hours?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
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
          user_id: string;
          role: ClubRole;
          display_name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          name: string;
          number: number;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          number: number;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          number?: number;
          active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalog_categories: {
        Row: {
          id: string;
          name: string;
          key: CatalogCategoryKey;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
      court_bookings: {
        Row: {
          id: string;
          court_id: string;
          booking_type: BookingType;
          status: BookingStatus;
          time_range: string;
          responsible_name: string | null;
          responsible_phone: string | null;
          player_id: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          court_id: string;
          booking_type: BookingType;
          status?: BookingStatus;
          time_range: string;
          responsible_name?: string | null;
          responsible_phone?: string | null;
          player_id?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          court_id?: string;
          booking_type?: BookingType;
          status?: BookingStatus;
          time_range?: string;
          responsible_name?: string | null;
          responsible_phone?: string | null;
          player_id?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "court_bookings_court_id_fkey"; columns: ["court_id"]; referencedRelation: "courts"; referencedColumns: ["id"] },
          { foreignKeyName: "court_bookings_player_id_fkey"; columns: ["player_id"]; referencedRelation: "players"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: never };
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      boards: {
        Row: {
          id: string;
          layout: Json;
          name: string;
        };
        Insert: {
          id: string;
          layout: Json;
          name: string;
        };
        Update: {
          id?: string;
          layout?: Json;
          name?: string;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          active: boolean;
          data: Json;
          id: string;
        };
        Insert: {
          active?: boolean;
          data: Json;
          id: string;
        };
        Update: {
          active?: boolean;
          data?: Json;
          id?: string;
        };
        Relationships: [];
      };
      game_events: {
        Row: {
          created_at: string;
          game_id: string;
          id: number;
          payload: Json;
          seat: number | null;
          type: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          id?: never;
          payload?: Json;
          seat?: number | null;
          type: string;
          version: number;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          id?: never;
          payload?: Json;
          seat?: number | null;
          type?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_events_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          created_at: string;
          finished_at: string | null;
          id: string;
          ready: Json;
          room_id: string;
          settings: Json;
          state: Json | null;
          status: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          ready?: Json;
          room_id: string;
          settings?: Json;
          state?: Json | null;
          status?: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          finished_at?: string | null;
          id?: string;
          ready?: Json;
          room_id?: string;
          settings?: Json;
          state?: Json | null;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "games_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      player_sessions: {
        Row: {
          auth_user_id: string;
          created_at: string;
          player_id: string;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          player_id: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_sessions_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          color: string;
          created_at: string;
          display_name: string;
          id: string;
          last_seen_at: string | null;
          pawn: string;
          room_id: string;
          seat: number;
        };
        Insert: {
          color?: string;
          created_at?: string;
          display_name: string;
          id?: string;
          last_seen_at?: string | null;
          pawn?: string;
          room_id: string;
          seat: number;
        };
        Update: {
          color?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          last_seen_at?: string | null;
          pawn?: string;
          room_id?: string;
          seat?: number;
        };
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          active: boolean;
          category: string;
          id: string;
          kind: string;
          level: number;
          options: Json | null;
          sheet_text: string | null;
          text: string;
        };
        Insert: {
          active?: boolean;
          category: string;
          id: string;
          kind: string;
          level: number;
          options?: Json | null;
          sheet_text?: string | null;
          text: string;
        };
        Update: {
          active?: boolean;
          category?: string;
          id?: string;
          kind?: string;
          level?: number;
          options?: Json | null;
          sheet_text?: string | null;
          text?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          password_hash: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          password_hash: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          password_hash?: string;
        };
        Relationships: [];
      };
      sheet_answers: {
        Row: {
          answer: string;
          player_id: string;
          question_id: string;
          updated_at: string;
        };
        Insert: {
          answer: string;
          player_id: string;
          question_id: string;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          player_id?: string;
          question_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sheet_answers_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sheet_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      used_questions: {
        Row: {
          question_id: string;
          room_id: string;
          seat: number | null;
          used_at: string;
        };
        Insert: {
          question_id: string;
          room_id: string;
          seat?: number | null;
          used_at?: string;
        };
        Update: {
          question_id?: string;
          room_id?: string;
          seat?: number | null;
          used_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "used_questions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "used_questions_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_game_action: {
        Args: {
          p_events: Json;
          p_expected_version: number;
          p_game_id: string;
          p_new_state: Json;
          p_reset_seats?: Json;
          p_used?: Json;
        };
        Returns: {
          created_at: string;
          finished_at: string | null;
          id: string;
          ready: Json;
          room_id: string;
          settings: Json;
          state: Json | null;
          status: string;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "games";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_player_id: { Args: never; Returns: string };
      current_room_id: { Args: never; Returns: string };
      set_lobby_ready: {
        Args: {
          p_game_id: string;
          p_new_state: Json;
          p_ready: boolean;
          p_seat: number;
          p_sheets_incomplete: boolean;
        };
        Returns: {
          created_at: string;
          finished_at: string | null;
          id: string;
          ready: Json;
          room_id: string;
          settings: Json;
          state: Json | null;
          status: string;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "games";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      start_lobby_game: {
        Args: { p_game_id: string; p_new_state: Json };
        Returns: {
          created_at: string;
          finished_at: string | null;
          id: string;
          ready: Json;
          room_id: string;
          settings: Json;
          state: Json | null;
          status: string;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "games";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;

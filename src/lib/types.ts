export type TripStatus = "active" | "ended";
export type UserRole = "user" | "admin";

export type Locale = "en" | "hi" | "ta";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  locale: Locale;
  created_at: string;
}

export interface Trip {
  id: string;
  owner_id: string;
  title: string;
  status: TripStatus;
  is_public: boolean;
  started_at: string;
  ended_at: string | null;
  total_distance_m: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  vehicle_id: string | null;
  driver_id: string | null;
  created_at: string;
}

export interface TripShare {
  id: string;
  trip_id: string;
  share_token: string;
  revoked: boolean;
  expires_at: string | null;
  password_hash: string | null;
  one_time: boolean;
  max_views: number | null;
  view_count: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  name: string;
  vehicle_type: "car" | "bike" | "truck" | "van" | "other";
  plate_number: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  owner_id: string;
  full_name: string;
  phone: string | null;
  license_number: string | null;
  vehicle_id: string | null;
  score: number;
  created_at: string;
}

export interface Geofence {
  id: string;
  owner_id: string;
  trip_id: string | null;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  created_at: string;
}

export interface GeofenceEvent {
  id: number;
  geofence_id: string;
  trip_id: string;
  event_type: "enter" | "exit";
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AppNotification {
  id: number;
  owner_id: string;
  title: string;
  body: string | null;
  severity: "info" | "warn" | "critical";
  read: boolean;
  created_at: string;
}

export interface ApiKey {
  id: string;
  owner_id: string;
  name: string;
  key_prefix: string;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface FuelLog {
  id: string;
  owner_id: string;
  vehicle_id: string;
  liters: number;
  cost: number;
  odometer_km: number | null;
  logged_at: string;
}

export interface MaintenanceReminder {
  id: string;
  owner_id: string;
  vehicle_id: string;
  title: string;
  due_date: string | null;
  due_odometer_km: number | null;
  completed: boolean;
  created_at: string;
}

export interface ExpenseLog {
  id: string;
  owner_id: string;
  vehicle_id: string | null;
  category: "fuel" | "maintenance" | "toll" | "parking" | "other";
  amount: number;
  note: string | null;
  logged_at: string;
}

export interface VehicleHealthLog {
  id: string;
  owner_id: string;
  vehicle_id: string;
  odometer_km: number | null;
  tire_condition: "good" | "worn" | "needs_replacement" | null;
  engine_status: "good" | "warning" | "critical" | null;
  notes: string | null;
  logged_at: string;
}

export interface Webhook {
  id: string;
  owner_id: string;
  url: string;
  event: "trip.started" | "trip.ended" | "geofence.enter" | "geofence.exit";
  secret: string;
  active: boolean;
  created_at: string;
}

export interface SharedTripResult {
  trip_id: string | null;
  title: string | null;
  status: TripStatus | null;
  started_at: string | null;
  ended_at: string | null;
  total_distance_m: number | null;
  max_speed_kmh: number | null;
  avg_speed_kmh: number | null;
  requires_password: boolean;
  ok: boolean;
  reason: "ok" | "not_found" | "expired" | "view_limit_reached" | "password_required" | "not_public";
}

export interface LocationPing {
  id: number;
  trip_id: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  heading: number | null;
  accuracy_m: number | null;
  recorded_at: string;
}

// Hand-written mirror of the SQL schema in supabase/schema.sql.
// Regenerate with `supabase gen types typescript` once the project
// is linked, and this file becomes unnecessary.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      trips: {
        Row: Trip;
        Insert: Partial<Trip> & { owner_id: string };
        Update: Partial<Trip>;
      };
      trip_shares: {
        Row: TripShare;
        Insert: Partial<TripShare> & { trip_id: string };
        Update: Partial<TripShare>;
      };
      locations: {
        Row: LocationPing;
        Insert: Omit<LocationPing, "id" | "recorded_at"> & { recorded_at?: string };
        Update: Partial<LocationPing>;
      };
      vehicles: { Row: Vehicle; Insert: Partial<Vehicle> & { owner_id: string; name: string }; Update: Partial<Vehicle> };
      drivers: { Row: Driver; Insert: Partial<Driver> & { owner_id: string; full_name: string }; Update: Partial<Driver> };
      geofences: {
        Row: Geofence;
        Insert: Partial<Geofence> & { owner_id: string; name: string; center_lat: number; center_lng: number };
        Update: Partial<Geofence>;
      };
      geofence_events: { Row: GeofenceEvent; Insert: Omit<GeofenceEvent, "id" | "created_at">; Update: never };
      audit_logs: { Row: AuditLog; Insert: never; Update: never };
      notifications: {
        Row: AppNotification;
        Insert: Partial<AppNotification> & { owner_id: string; title: string };
        Update: Partial<AppNotification>;
      };
      api_keys: { Row: ApiKey; Insert: never; Update: Partial<Pick<ApiKey, "revoked">> };
      webhooks: {
        Row: Webhook;
        Insert: Partial<Webhook> & { owner_id: string; url: string; event: Webhook["event"] };
        Update: Partial<Webhook>;
      };
      emergency_contacts: {
        Row: EmergencyContact;
        Insert: Partial<EmergencyContact> & { owner_id: string; name: string; phone: string };
        Update: Partial<EmergencyContact>;
      };
      fuel_logs: {
        Row: FuelLog;
        Insert: Partial<FuelLog> & { owner_id: string; vehicle_id: string; liters: number; cost: number };
        Update: Partial<FuelLog>;
      };
      maintenance_reminders: {
        Row: MaintenanceReminder;
        Insert: Partial<MaintenanceReminder> & { owner_id: string; vehicle_id: string; title: string };
        Update: Partial<MaintenanceReminder>;
      };
      expense_logs: {
        Row: ExpenseLog;
        Insert: Partial<ExpenseLog> & { owner_id: string; amount: number };
        Update: Partial<ExpenseLog>;
      };
      vehicle_health_logs: {
        Row: VehicleHealthLog;
        Insert: Partial<VehicleHealthLog> & { owner_id: string; vehicle_id: string };
        Update: Partial<VehicleHealthLog>;
      };
      app_settings: {
        Row: { key: string; value: Record<string, unknown>; updated_at: string };
        Insert: { key: string; value: Record<string, unknown> };
        Update: { value: Record<string, unknown> };
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      log_audit: {
        Args: { p_action: string; p_entity_type: string; p_entity_id: string; p_metadata?: Record<string, unknown> };
        Returns: void;
      };
      set_share_password: { Args: { p_share_id: string; p_password: string | null }; Returns: void };
      get_shared_trip: {
        Args: { p_token: string; p_password?: string | null };
        Returns: SharedTripResult[];
      };
      get_shared_locations: {
        Args: { p_token: string; p_password?: string | null; p_since?: string | null };
        Returns: LocationPing[];
      };
      create_api_key: { Args: { p_name: string }; Returns: { id: string; plaintext_key: string }[] };
      verify_api_key: { Args: { p_key: string }; Returns: string | null };
      api_list_trips: { Args: { p_key: string }; Returns: Trip[] };
      api_get_trip_locations: { Args: { p_key: string; p_trip_id: string }; Returns: LocationPing[] };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

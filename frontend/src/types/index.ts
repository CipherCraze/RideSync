export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  profile_picture?: string;
  driving_license_number?: string;
  address?: string;
  bio?: string;
  honor_score: number;
  is_verified: boolean;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface UserProfile extends User {
  vehicles_count: number;
  bookings_count: number;
  reviews_count: number;
  honor_category: 'Trusted' | 'Good' | 'Warning' | 'Restricted';
}

export type VehicleAngle = 'FRONT' | 'REAR' | 'SIDE_LEFT' | 'SIDE_RIGHT' | 'INTERIOR' | 'DASHBOARD' | 'OTHER';
export type VehicleStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type VehicleDocumentType = 'RC' | 'PUC' | 'SERVICE_RECORD' | 'INSURANCE';
export type VehicleDocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface VehicleImage {
  id?: number;
  image_url: string;
  angle?: VehicleAngle;
  is_primary: boolean;
}

export interface VehicleDocument {
  id: number;
  vehicle_id: number;
  document_type: VehicleDocumentType;
  document_url: string;
  document_number?: string;
  expiry_date?: string;
  status: VehicleDocumentStatus;
  rejection_reason?: string;
  uploaded_at: string;
  verified_at?: string;
  verified_by_id?: number;
}

export interface Vehicle {
  id: number;
  owner_id: number;
  brand: string;
  model: string;
  year: number;
  vehicle_type: 'Sedan' | 'SUV' | 'Hatchback' | 'Convertible' | 'Truck' | 'Van' | 'Electric' | 'Luxury';
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission: 'Automatic' | 'Manual';
  seats: number;
  price_per_day: number;
  description: string;
  pickup_location: string;
  latitude?: number;
  longitude?: number;
  status?: VehicleStatus;
  rejection_reason?: string;
  is_approved: boolean;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
  geofence_type?: 'CIRCULAR' | 'FLEXIBLE';
  geofence_center_lat?: number | null;
  geofence_center_lng?: number | null;
  geofence_radius_km?: number | null;
  geofence_center_name?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  speed_kmh?: number | null;
  battery_or_fuel_level?: number | null;
  last_location_update?: string | null;
  is_geofence_breached?: boolean;
  breach_distance_km?: number;
  created_at: string;
  images: VehicleImage[];
  documents?: VehicleDocument[];
  owner?: User;
}

export interface VehicleDetail extends Vehicle {
  owner: User;
}


export interface Booking {
  id: number;
  renter_id: number;
  vehicle_id: number;
  owner_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'RENTAL_ACTIVE' | 'RETURNED' | 'COMPLETED' | 'CANCELLED';
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
  is_overdue?: boolean;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  renter?: User;
  owner?: User;
  vehicle?: Vehicle;
}

export interface Review {
  id: number;
  booking_id: number;
  reviewer_id: number;
  reviewee_id?: number;
  vehicle_id?: number;
  rating: number;
  comment: string;
  review_type: 'RENTER_TO_OWNER' | 'OWNER_TO_RENTER' | 'VEHICLE';
  is_hidden?: boolean;
  created_at: string;
  reviewer?: User;
  reviewee?: User;
}

export interface ReviewEligibility {
  booking_id: number;
  can_review: boolean;
  already_reviewed: boolean;
  reason?: string;
  suggested_reviewee_id?: number;
  suggested_review_type?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  booking_id?: number;
  created_at: string;
  updated_at: string;
  user1?: User;
  user2?: User;
  other_user?: User;
  last_message?: Message;
  unread_count: number;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link_url?: string;
  payload_json?: string;
  created_at: string;
}

export interface ReportItem {
  id: number;
  reporter_id: number;
  reported_user_id?: number;
  reported_vehicle_id?: number;
  booking_id?: number;
  review_id?: number;
  reason: string;
  details: string;
  description?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'PENDING' | 'DISMISSED';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  reporter?: User;
  reported_user?: User;
  reported_vehicle?: Vehicle;
  review?: Review;
}

export interface HonorScoreHistory {
  id: number;
  user_id: number;
  points_change: number;
  previous_score: number;
  new_score: number;
  change?: number;
  old_score?: number;
  category: string;
  reason: string;
  reference_type?: string;
  reference_id?: number;
  created_at: string;
}

export interface AdminAnalytics {
  total_users: number;
  verified_users: number;
  total_vehicles: number;
  pending_vehicles: number;
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  total_reports: number;
  pending_reports: number;
  pending_documents?: number;
  average_honor_score: number;

}

export interface Transaction {
  id: number;
  booking_id: number;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface VehicleTrackingInfo {
  vehicle_id: number;
  brand: string;
  model: string;
  year: number;
  license_plate?: string | null;
  status: string;
  is_available: boolean;
  rental_status: 'Idle' | 'Rented' | 'Unavailable';
  active_renter_name?: string | null;
  geofence_type: 'CIRCULAR' | 'FLEXIBLE';
  geofence_center_lat?: number | null;
  geofence_center_lng?: number | null;
  geofence_radius_km?: number | null;
  geofence_center_name?: string | null;
  approx_latitude: number;
  approx_longitude: number;
  accuracy_radius_m: number;
  is_obfuscated: boolean;
  is_breached: boolean;
  breach_distance_km: number;
  breach_severity: 'SAFE' | 'NEAR_BREACH' | 'DISTANT_BREACH';
  status_label: 'Inside Safe Zone' | 'Geofence Breached' | 'Idle' | 'Rented';
  speed_kmh: number;
  battery_or_fuel_level?: number | null;
  last_updated: string;
}

export interface TrackingConfig {
  default_masking_buffer_km: number;
  gradient_near_threshold_km: number;
  gradient_near_accuracy_km: number;
  gradient_far_threshold_km: number;
  gradient_far_accuracy_km: number;
  gradient_sensitivity: number;
}

export interface UserListingSummary {
  id: number;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  vehicle_type: string;
  pickup_location: string;
  rating_avg: number;
  rating_count: number;
  is_available: boolean;
  primary_image?: string | null;
  geofence_type?: string | null;
  geofence_radius_km?: number | null;
  geofence_center_name?: string | null;
}

export interface UserPublicCard {
  id: number;
  full_name: string;
  profile_picture?: string | null;
  bio?: string | null;
  is_owner: boolean;
  is_renter: boolean;
  honor_score: number;
  honor_category: string;
  joined_date: string;
  active_listings_count: number;
  completed_trips_count: number;
  rating_avg: number;
}

export interface UserPublicDetail extends UserPublicCard {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active_listings: UserListingSummary[];
}

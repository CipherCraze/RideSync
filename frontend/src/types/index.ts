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

export interface VehicleImage {
  id?: number;
  image_url: string;
  is_primary: boolean;
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
  is_approved: boolean;
  is_available: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  images: VehicleImage[];
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

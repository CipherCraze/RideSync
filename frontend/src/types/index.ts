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
  created_at: string;
  reviewer?: User;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link_url?: string;
  created_at: string;
}

export interface ReportItem {
  id: number;
  reporter_id: number;
  reported_user_id?: number;
  reported_vehicle_id?: number;
  reason: 'FAKE_LISTING' | 'INAPPROPRIATE_BEHAVIOR' | 'VEHICLE_DAMAGE' | 'FRAUD' | 'LATE_RETURN' | 'OTHER';
  details: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reporter?: User;
  reported_user?: User;
  reported_vehicle?: Vehicle;
}

export interface HonorScoreHistory {
  id: number;
  user_id: number;
  points_change: number;
  previous_score: number;
  new_score: number;
  category: string;
  reason: string;
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

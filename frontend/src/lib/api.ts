import axios from "axios";
import {
  User,
  UserProfile,
  Vehicle,
  VehicleDetail,
  Booking,
  Review,
  NotificationItem,
  ReportItem,
  HonorScoreHistory,
  AdminAnalytics,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach JWT auth token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ridesync_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const apiService = {
  // Auth
  register: async (data: any) => {
    const res = await api.post<User>("/auth/register", data);
    return res.data;
  },
  login: async (credentials: any) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>("/auth/login", credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<UserProfile>("/auth/me");
    return res.data;
  },

  // Users
  getUserProfile: async (id: number) => {
    const res = await api.get<UserProfile>(`/users/profile/${id}`);
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await api.put<User>("/users/profile", data);
    return res.data;
  },
  requestVerification: async (data: { driving_license_number: string }) => {
    const res = await api.post<User>("/users/verify-request", data);
    return res.data;
  },
  getHonorHistory: async () => {
    const res = await api.get<HonorScoreHistory[]>("/users/honor-history");
    return res.data;
  },

  // Vehicles
  searchVehicles: async (params?: any) => {
    const res = await api.get<Vehicle[]>("/vehicles/", { params });
    return res.data;
  },
  getVehicle: async (id: number) => {
    const res = await api.get<VehicleDetail>(`/vehicles/${id}`);
    return res.data;
  },
  getMyListings: async () => {
    const res = await api.get<Vehicle[]>("/vehicles/my-listings");
    return res.data;
  },
  createVehicle: async (data: any) => {
    const res = await api.post<VehicleDetail>("/vehicles/", data);
    return res.data;
  },
  updateVehicle: async (id: number, data: any) => {
    const res = await api.put<VehicleDetail>(`/vehicles/${id}`, data);
    return res.data;
  },
  deleteVehicle: async (id: number) => {
    await api.delete(`/vehicles/${id}`);
  },

  // Bookings
  createBooking: async (data: { vehicle_id: number; start_date: string; end_date: string }) => {
    const res = await api.post<Booking>("/bookings/", data);
    return res.data;
  },
  getMyRentals: async (status?: string) => {
    const res = await api.get<Booking[]>("/bookings/my-rentals", { params: { status } });
    return res.data;
  },
  getIncomingRequests: async (status?: string) => {
    const res = await api.get<Booking[]>("/bookings/incoming-requests", { params: { status } });
    return res.data;
  },
  getBooking: async (id: number) => {
    const res = await api.get<Booking>(`/bookings/${id}`);
    return res.data;
  },
  updateBookingStatus: async (id: number, data: { status: string; cancellation_reason?: string }) => {
    const res = await api.put<Booking>(`/bookings/${id}/status`, data);
    return res.data;
  },

  // Reviews
  createReview: async (data: any) => {
    const res = await api.post<Review>("/reviews/", data);
    return res.data;
  },
  getVehicleReviews: async (vehicleId: number) => {
    const res = await api.get<Review[]>(`/reviews/vehicle/${vehicleId}`);
    return res.data;
  },
  getUserReviews: async (userId: number) => {
    const res = await api.get<Review[]>(`/reviews/user/${userId}`);
    return res.data;
  },

  // Notifications
  getNotifications: async () => {
    const res = await api.get<NotificationItem[]>("/notifications/");
    return res.data;
  },
  markNotificationRead: async (id: number) => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllNotificationsRead: async () => {
    await api.put("/notifications/read-all");
  },

  // Reports
  createReport: async (data: any) => {
    const res = await api.post<ReportItem>("/reports/", data);
    return res.data;
  },

  // Admin
  getAdminAnalytics: async () => {
    const res = await api.get<AdminAnalytics>("/admin/analytics");
    return res.data;
  },
  getPendingVehicles: async () => {
    const res = await api.get<Vehicle[]>("/admin/pending-vehicles");
    return res.data;
  },
  approveVehicle: async (id: number) => {
    const res = await api.put<Vehicle>(`/admin/vehicles/${id}/approve`);
    return res.data;
  },
  getPendingVerifications: async () => {
    const res = await api.get<User[]>("/admin/pending-verifications");
    return res.data;
  },
  verifyUser: async (id: number) => {
    const res = await api.put<User>(`/admin/users/${id}/verify`);
    return res.data;
  },
  suspendUser: async (id: number) => {
    const res = await api.put<User>(`/admin/users/${id}/suspend`);
    return res.data;
  },
  adjustHonorScore: async (data: { user_id: number; points_change: number; reason: string }) => {
    const res = await api.put<User>("/admin/users/honor-score", data);
    return res.data;
  },
  getAdminReports: async (status?: string) => {
    const res = await api.get<ReportItem[]>("/admin/reports", { params: { status } });
    return res.data;
  },
  updateAdminReport: async (id: number, data: { status: string; admin_notes?: string }) => {
    const res = await api.put<ReportItem>(`/admin/reports/${id}`, data);
    return res.data;
  },
};

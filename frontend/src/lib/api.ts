import axios from "axios";
import {
  User,
  UserProfile,
  Vehicle,
  VehicleDetail,
  Booking,
  Review,
  ReviewEligibility,
  Conversation,
  ConversationDetail,
  Message,
  NotificationItem,
  ReportItem,
  HonorScoreHistory,
  AdminAnalytics,
  Transaction,
  VehicleDocument,
  VehicleTrackingInfo,
  TrackingConfig,
  UserPublicCard,
  UserPublicDetail,
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
  loginWithGoogle: async (token: string) => {
    const res = await api.post<{ access_token: string; token_type: string; user: User }>("/auth/google", { token });
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
  getVehicleAvailability: async (id: number) => {
    const res = await api.get<{start_date: string; end_date: string}[]>(`/vehicles/${id}/availability`);
    return res.data;
  },
  submitVehicleForReview: async (id: number) => {
    const res = await api.put<VehicleDetail>(`/vehicles/${id}/submit`);
    return res.data;
  },
  addVehicleDocument: async (vehicleId: number, data: { document_type: string; document_url: string; document_number?: string; expiry_date?: string }) => {
    const res = await api.post<VehicleDocument>(`/vehicles/${vehicleId}/documents`, data);
    return res.data;
  },
  getVehicleDocuments: async (vehicleId: number) => {
    const res = await api.get<VehicleDocument[]>(`/vehicles/${vehicleId}/documents`);
    return res.data;
  },
  uploadFiles: async (files: FileList | File[]) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    const res = await api.post<string[]>("/uploads/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ url: string; filename: string; content_type: string; size: number }>("/uploads/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
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
  processPayment: async (id: number, status: string = "SUCCESS") => {
    const res = await api.post<Transaction>(`/bookings/${id}/pay?status=${status}`);
    return res.data;
  },
  getBookingReceipt: async (id: number) => {
    const res = await api.get<Transaction[]>(`/bookings/${id}/receipt`);
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
  getReviewsGiven: async () => {
    const res = await api.get<Review[]>("/reviews/given");
    return res.data;
  },
  getReviewsReceived: async () => {
    const res = await api.get<Review[]>("/reviews/received");
    return res.data;
  },
  checkReviewEligibility: async (bookingId: number) => {
    const res = await api.get<ReviewEligibility>(`/reviews/booking/${bookingId}/eligibility`);
    return res.data;
  },

  // Notifications
  getNotifications: async () => {
    const res = await api.get<NotificationItem[]>("/notifications/");
    return res.data;
  },
  getNotificationUnreadCount: async () => {
    const res = await api.get<{ unread_count: number }>("/notifications/unread-count");
    return res.data;
  },
  markNotificationRead: async (id: number) => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllNotificationsRead: async () => {
    await api.put("/notifications/read-all");
  },

  // Chat & Messaging
  getConversations: async () => {
    const res = await api.get<Conversation[]>("/chat/conversations");
    return res.data;
  },
  createConversation: async (data: { recipient_id: number; booking_id?: number }) => {
    const res = await api.post<ConversationDetail>("/chat/conversations", data);
    return res.data;
  },
  getConversation: async (id: number) => {
    const res = await api.get<ConversationDetail>(`/chat/conversations/${id}`);
    return res.data;
  },
  getConversationMessages: async (conversationId: number, limit: number = 100) => {
    const res = await api.get<Message[]>(`/chat/conversations/${conversationId}/messages`, { params: { limit } });
    return res.data;
  },
  sendMessage: async (conversationId: number, content: string) => {
    const res = await api.post<Message>(`/chat/conversations/${conversationId}/messages`, { content });
    return res.data;
  },
  markConversationRead: async (conversationId: number) => {
    await api.put(`/chat/conversations/${conversationId}/read`);
  },
  getChatUnreadCount: async () => {
    const res = await api.get<{ unread_count: number }>("/chat/unread-count");
    return res.data;
  },

  // Reports
  createReport: async (data: any) => {
    const res = await api.post<ReportItem>("/reports/", data);
    return res.data;
  },
  getMyReports: async () => {
    const res = await api.get<ReportItem[]>("/reports/my-reports");
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
  rejectVehicle: async (id: number, reason: string) => {
    const res = await api.put<Vehicle>(`/admin/vehicles/${id}/reject`, { reason });
    return res.data;
  },
  getPendingDocuments: async () => {
    const res = await api.get<VehicleDocument[]>("/admin/documents/pending");
    return res.data;
  },
  verifyDocument: async (id: number) => {
    const res = await api.put<VehicleDocument>(`/admin/documents/${id}/verify`);
    return res.data;
  },
  rejectDocument: async (id: number, reason: string) => {
    const res = await api.put<VehicleDocument>(`/admin/documents/${id}/reject`, { rejection_reason: reason, status: "REJECTED" });
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
  adjustHonorScore: async (data: { user_id: number; points_change: number; reason: string; reference_type?: string; reference_id?: number }) => {
    const res = await api.put<User>("/admin/users/honor-score", data);
    return res.data;
  },
  getUserHonorHistoryAdmin: async (userId: number) => {
    const res = await api.get<HonorScoreHistory[]>(`/admin/users/${userId}/honor-history`);
    return res.data;
  },
  moderateReview: async (reviewId: number, isHidden: boolean = true) => {
    const res = await api.put<Review>(`/admin/reviews/${reviewId}/moderate?is_hidden=${isHidden}`);
    return res.data;
  },
  getAdminReports: async (status?: string) => {
    const res = await api.get<ReportItem[]>("/admin/reports", { params: { status } });
    return res.data;
  },
  updateAdminReport: async (id: number, data: { status: string; admin_notes?: string; honor_score_penalty?: number; hide_review?: boolean }) => {
    const res = await api.put<ReportItem>(`/admin/reports/${id}`, data);
    return res.data;
  },

  // Uploads
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ url: string; filename: string; content_type: string; size: number }>(
      "/uploads/avatar",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

  // Fleet Tracking & Geofencing
  getMyFleetTracking: async () => {
    const res = await api.get<VehicleTrackingInfo[]>("/tracking/fleet");
    return res.data;
  },
  getVehicleTracking: async (vehicleId: number) => {
    const res = await api.get<VehicleTrackingInfo>(`/tracking/vehicles/${vehicleId}`);
    return res.data;
  },
  simulateVehicleMovement: async (
    vehicleId: number,
    targetState: "IN_BOUNDS" | "NEAR_BREACH" | "DISTANT_BREACH" | "RESET",
    customDistanceKm?: number
  ) => {
    const res = await api.post<VehicleTrackingInfo>(`/tracking/vehicles/${vehicleId}/simulate`, {
      target_state: targetState,
      custom_distance_km: customDistanceKm,
    });
    return res.data;
  },

  // User Discovery & Public Profiles
  discoverUsers: async (query?: string, role?: string) => {
    const res = await api.get<UserPublicCard[]>("/users/discover", {
      params: { query: query || undefined, role: role || undefined },
    });
    return res.data;
  },
  getPublicUserProfile: async (userId: number) => {
    const res = await api.get<UserPublicDetail>(`/users/${userId}/public`);
    return res.data;
  },

  // Admin Tracking Config
  getAdminTrackingConfig: async () => {
    const res = await api.get<TrackingConfig>("/admin/tracking-config");
    return res.data;
  },
  updateAdminTrackingConfig: async (data: Partial<TrackingConfig>) => {
    const res = await api.put<TrackingConfig>("/admin/tracking-config", data);
    return res.data;
  },
};

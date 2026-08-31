export type BookingStatus = "pending" | "approved" | "cancelled" | "completed";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  color: string;
  licensePlate: string;
  driver: string;
  seats: number;
  imageDriveId?: string;
  imageUrl?: string;
  active: boolean;
}

export interface Booking {
  id: string;
  date: string;
  firstName: string;
  lastName: string;
  phone: string;
  activity: string;
  destination: string;
  province: string;
  passengers: number;
  vehicleId: string;
  vehicleName?: string;
  status: BookingStatus;
  distance?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  telegramChatId: string;
  telegramBotToken: string;
  adminPassword: string;
  schoolName: string;
}

export interface DashboardStats {
  totalDistanceThisMonth: number;
  travelDaysThisMonth: number;
  totalBookingsThisMonth: number;
  pendingBookings: number;
  approvedBookings: number;
  totalVehicles: number;
  recentBookings: Booking[];
}

export interface BookingFormData {
  date: string;
  firstName: string;
  lastName: string;
  phone: string;
  activity: string;
  destination: string;
  province: string;
  passengers: number;
  vehicleId: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  color: string;
  licensePlate: string;
  driver: string;
  seats: number;
  imageDriveId?: string;
  active?: boolean;
}

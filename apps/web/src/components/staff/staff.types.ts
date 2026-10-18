export interface StaffMember {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

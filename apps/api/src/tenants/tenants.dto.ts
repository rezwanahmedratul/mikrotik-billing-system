import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@mikrotik-billing/shared';

export const CreateStaffSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid staff role' }) }),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().optional(),
});

export class CreateStaffDto {
  @ApiProperty({ example: 'technician@fastnet.com' })
  email!: string;

  @ApiProperty({ example: 'Rafiqul Islam' })
  fullName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ISP_OPERATOR })
  role!: UserRole;

  @ApiProperty({ example: 'TempPass123!' })
  password!: string;

  @ApiPropertyOptional({ example: '+8801700112233' })
  phone?: string;
}

export const UpdateStaffSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export class UpdateStaffDto {
  @ApiPropertyOptional({ enum: UserRole, example: UserRole.CASHIER })
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}

export const UpdateTenantSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
});

export class UpdateTenantSettingsDto {
  @ApiPropertyOptional({ example: 'FastNet Fiber Ltd' })
  name?: string;

  @ApiPropertyOptional({ example: 'support@fastnet.com' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+8801700112233' })
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'BDT' })
  currency?: string;

  @ApiPropertyOptional({ example: 'Asia/Dhaka' })
  timezone?: string;
}

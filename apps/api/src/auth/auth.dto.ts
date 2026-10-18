import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  tenantId: z.string().optional(),
});

export class LoginDto {
  @ApiProperty({ example: 'admin@fastnet.com' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  password!: string;

  @ApiPropertyOptional({ example: 'uuid-or-code' })
  tenantId?: string;
}

export const RegisterTenantSchema = z.object({
  tenantName: z.string().min(2, 'Organization name must be at least 2 characters'),
  tenantCode: z
    .string()
    .min(2, 'Organization code must be at least 2 characters')
    .regex(
      /^[A-Z0-9_-]+$/i,
      'Code must contain only alphanumeric characters, dashes, or underscores'
    ),
  adminEmail: z.string().email('Please enter a valid admin email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  adminFullName: z.string().min(2, 'Administrator full name is required'),
  contactPhone: z.string().optional(),
});

export class RegisterTenantDto {
  @ApiProperty({ example: 'Apex Broadband Ltd' })
  tenantName!: string;

  @ApiProperty({ example: 'APEX_NET' })
  tenantCode!: string;

  @ApiProperty({ example: 'owner@apexnet.com' })
  adminEmail!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  adminPassword!: string;

  @ApiProperty({ example: 'Tariqul Islam' })
  adminFullName!: string;

  @ApiPropertyOptional({ example: '+8801700000000' })
  contactPhone?: string;
}

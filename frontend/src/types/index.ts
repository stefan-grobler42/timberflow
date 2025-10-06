export interface User {
  id: number;
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
  hireDate: string;
  address: string;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateUserDto {
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  isActive: boolean;
  hireDate: string;
  address: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface UpdateUserDto {
  userCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  role?: string;
  isActive?: boolean;
  hireDate?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateRoleDto {
  name: string;
  description: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface Company {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateCompanyDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Customer {
  id: number;
  accountNo: string;
  accountName: string;
  companyTypeId: number | null;
  email: string;
  phone: string;
  website: string | null;
  vatRegistrationNo: string | null;
  companyRegistrationNo: string | null;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  customerStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companyType: Company | null;
}

export interface CreateCustomerDto {
  accountNo: string;
  accountName: string;
  companyTypeId?: number;
  email: string;
  phone: string;
  website?: string;
  vatRegistrationNo?: string;
  companyRegistrationNo?: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  customerStatus: string;
  isActive: boolean;
}

export interface UpdateCustomerDto {
  accountNo?: string;
  accountName?: string;
  companyTypeId?: number;
  email?: string;
  phone?: string;
  website?: string;
  vatRegistrationNo?: string;
  companyRegistrationNo?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  customerStatus?: string;
  isActive?: boolean;
}

export interface Contact {
  id: number;
  customerId: number;
  name: string;
  email: string;
  phone: string;
  designation: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateContactDto {
  customerId: number;
  name: string;
  email: string;
  phone: string;
  designation: string;
  isPrimary: boolean;
}

export interface UpdateContactDto {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  isPrimary?: boolean;
}

export interface Activity {
  id: number;
  customerId: number;
  activityType: string;
  subject: string;
  description: string | null;
  activityDate: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateActivityDto {
  customerId: number;
  activityType: string;
  subject: string;
  description?: string;
  activityDate?: string;
}

export interface UpdateActivityDto {
  activityType?: string;
  subject?: string;
  description?: string;
  activityDate?: string;
}

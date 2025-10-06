import { api } from './api';
import type { User, CreateUserDto, UpdateUserDto } from '../types';

export const userService = {
  getAll: () => api.get<User[]>('/users'),
  
  getById: (id: number) => api.get<User>(`/users/${id}`),
  
  create: (data: CreateUserDto) => api.post<User>('/users', data),
  
  update: (id: number, data: UpdateUserDto) => api.put<User>(`/users/${id}`, data),
  
  delete: (id: number) => api.delete(`/users/${id}`),
};

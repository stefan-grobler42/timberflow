/**
 * plannerV2 Module
 * 
 * Clean, isolated scheduling utilities for the production planner.
 * This module provides all the core scheduling logic including:
 * - Type definitions for jobs, shifts, and breaks
 * - Duration calculations based on E-Finks
 * - Shift configuration and break management
 * - Visual sizing calculations
 * - Cascade scheduling and overflow handling
 * - Change staging and persistence management
 * - Scheduler configuration from system settings
 */

export * from './types';
export * from './constants';
export * from './durationCalculator';
export * from './shiftCalendar';
export * from './schedulerEngine';
export * from './stagingManager';
export * from './continuousFlowAllocator';
export * from './schedulerSettings';
export * from './scheduleNormalizer';

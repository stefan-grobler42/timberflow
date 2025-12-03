/**
 * plannerV2 Module
 * 
 * Clean, isolated scheduling utilities for the production planner.
 * This module provides all the core scheduling logic including:
 * - Type definitions for jobs, shifts, and breaks
 * - Duration calculations based on E-Finks
 * - Shift configuration and break management
 * - Visual sizing calculations
 */

export * from './types';
export * from './constants';
export * from './durationCalculator';
export * from './shiftCalendar';

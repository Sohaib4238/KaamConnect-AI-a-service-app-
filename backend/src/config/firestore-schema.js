/**
 * Schema definitions and collection names for Firestore.
 * This centralizes all top-level collection names used across the backend.
 */

/**
 * Collection containing service providers.
 * Each document represents a skilled worker or business offering services.
 * Contains location, service categories, pricing, and reputation scores.
 */
export const PROVIDERS = 'providers';

/**
 * Collection containing user bookings and service requests.
 * Tracks the lifecycle of a job from requested -> matched -> ongoing -> completed/cancelled.
 */
export const BOOKINGS = 'bookings';

/**
 * Collection for logging agent traces and reasoning steps.
 * Used for transparency, debugging, and viewing the live thought process of the orchestrator.
 */
export const TRACES = 'traces';

/**
 * Collection for system-wide metrics and analytics.
 * Stores aggregated data like total jobs, success rates, average response times.
 */
export const METRICS = 'metrics';

/**
 * Collection for community-based trust scores (Mohalla Trust).
 * Tracks peer reviews, localized reputation signals, and verified community recommendations.
 */
export const MOHALLA_TRUST = 'mohalla_trust';

/**
 * Collection for dispute resolution cases.
 * Logs issues raised by users or providers, evidence provided, and resolution state.
 */
export const DISPUTES = 'disputes';

/**
 * Collection for scheduled tasks and reminders.
 * Keeps track of pending notifications or automated follow-ups for bookings.
 */
export const SCHEDULES = 'schedules';
export const REMINDERS = 'reminders';


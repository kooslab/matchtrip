import {
	pgTable,
	uuid,
	text,
	timestamp,
	boolean,
	pgEnum,
	integer,
	serial,
	varchar
} from 'drizzle-orm/pg-core';

// Define the enum for user roles
export const userRoleEnum = pgEnum('user_role', ['traveler', 'guide', 'admin']);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	role: userRoleEnum('role').notNull().default('traveler'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

// User agreements table to track consent
export const userAgreements = pgTable('user_agreements', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	termsAgreed: boolean('terms_agreed').notNull().default(false),
	privacyAgreed: boolean('privacy_agreed').notNull().default(false),
	marketingAgreed: boolean('marketing_agreed').notNull().default(false),
	termsAgreedAt: timestamp('terms_agreed_at'),
	privacyAgreedAt: timestamp('privacy_agreed_at'),
	marketingAgreedAt: timestamp('marketing_agreed_at'),
	updatedAt: timestamp('updated_at').notNull()
});

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});

export const accounts = pgTable('accounts', {
	id: uuid('id').primaryKey().defaultRandom(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verifications = pgTable('verifications', {
	id: uuid('id').primaryKey().defaultRandom(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

// Rate limit table for better-auth
export const rateLimits = pgTable('rate_limits', {
	id: uuid('id').primaryKey().defaultRandom(),
	key: text('key').notNull().unique(),
	points: integer('points').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const destinations = pgTable('destinations', {
	id: serial('id').primaryKey(),
	city: varchar('city', { length: 50 }).notNull(),
	country: varchar('country', { length: 50 }).notNull(),
	created_at: timestamp('created_at').defaultNow().notNull(),
	updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define enum for travel methods
export const travelMethodEnum = pgEnum('travel_method', [
	'walking',
	'driving',
	'public_transport',
	'bike',
	'walking+public_transport',
	'walking+bike',
	'walking+driving',
	'walking+driving+public_transport',
	'walking+driving+bike',
	'walking+driving+public_transport+bike',
	'other'
]);
export type TravelMethod = (typeof travelMethodEnum.enumValues)[number];

// Define enum for trip status
export const tripStatusEnum = pgEnum('trip_status', [
	'draft',
	'submitted',
	'accepted',
	'completed',
	'cancelled'
]);
export type TripStatus = (typeof tripStatusEnum.enumValues)[number];

export const trips = pgTable('trips', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	destinationId: integer('destination_id')
		.notNull()
		.references(() => destinations.id, { onDelete: 'restrict' }),
	adultsCount: integer('adults_count').notNull().default(1),
	childrenCount: integer('children_count').notNull().default(0),
	startDate: timestamp('start_date').notNull(),
	endDate: timestamp('end_date').notNull(),
	travelMethod: travelMethodEnum('travel_method'),
	customRequest: text('custom_request'),
	// Trip status tracking
	status: tripStatusEnum('status').notNull().default('draft'),
	statusUpdatedAt: timestamp('status_updated_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Define enum for offer status
export const offerStatusEnum = pgEnum('offer_status', [
	'pending',
	'accepted',
	'rejected',
	'withdrawn'
]);
export type OfferStatus = (typeof offerStatusEnum.enumValues)[number];

export const offers = pgTable('offers', {
	id: uuid('id').primaryKey().defaultRandom(),
	tripId: uuid('trip_id')
		.notNull()
		.references(() => trips.id, { onDelete: 'cascade' }),
	guideId: uuid('guide_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	travelerId: uuid('traveler_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description').notNull(),
	price: integer('price').notNull(), // in cents to avoid decimal issues
	currency: varchar('currency', { length: 3 }).notNull().default('USD'),
	duration: integer('duration'), // duration in hours
	maxParticipants: integer('max_participants'),
	status: offerStatusEnum('status').notNull().default('pending'),
	validUntil: timestamp('valid_until'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const tripStatusHistory = pgTable('trip_status_history', {
	id: uuid('id').primaryKey().defaultRandom(),
	tripId: uuid('trip_id').references(() => trips.id),
	status: tripStatusEnum('status').notNull(),
	changedAt: timestamp('changed_at').defaultNow().notNull(),
	changedBy: uuid('changed_by').references(() => users.id)
});

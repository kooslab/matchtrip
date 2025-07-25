import {
	pgTable,
	uuid,
	text,
	timestamp,
	boolean,
	pgEnum,
	integer,
	serial,
	varchar,
	date,
	jsonb,
	index
} from 'drizzle-orm/pg-core';

// Define the enum for user roles
export const userRoleEnum = pgEnum('user_role', ['traveler', 'guide']);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		email: text('email').notNull().unique(),
		emailVerified: boolean('email_verified').notNull().default(false),
		image: text('image'),
		role: userRoleEnum('role'),
		phone: text('phone'),
		birthDate: date('birth_date'),
		onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for frequently queried columns
		roleIdx: index('users_role_idx').on(table.role),
		emailIdx: index('users_email_idx').on(table.email)
	})
);

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
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Guide profiles table for additional guide information
export const guideProfiles = pgTable('guide_profiles', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
		.unique(),
	username: text('username'),
	currentLocation: text('current_location'),
	guideAreas: text('guide_areas'),
	activityAreas: jsonb('activity_areas').$type<string[]>(),
	experience: text('experience'),
	languages: jsonb('languages').$type<string[]>(),
	certifications: text('certifications'),
	introduction: text('introduction'),
	profileImageUrl: text('profile_image_url'),
	idDocumentUrl: text('id_document_url'),
	certificationUrls: jsonb('certification_urls').$type<string[]>(),
	qualifications: jsonb('qualifications').$type<Record<string, string>>(),
	isVerified: boolean('is_verified').notNull().default(false),
	verifiedAt: timestamp('verified_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Traveler profiles table for additional traveler information
export const travelerProfiles = pgTable('traveler_profiles', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
		.unique(),
	username: text('username'),
	nationality: text('nationality'),
	travelStyle: text('travel_style'),
	budgetRange: text('budget_range'),
	preferredLanguages: jsonb('preferred_languages').$type<string[]>(),
	travelFrequency: text('travel_frequency'),
	interests: jsonb('interests').$type<string[]>(),
	dietaryRestrictions: jsonb('dietary_restrictions').$type<string[]>(),
	accessibilityNeeds: text('accessibility_needs'),
	emergencyContact: text('emergency_contact'),
	emergencyPhone: text('emergency_phone'),
	profileImageUrl: text('profile_image_url'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// File uploads table to track all uploaded files
export const fileUploads = pgTable('file_uploads', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	originalName: text('original_name').notNull(),
	fileType: text('file_type').notNull(),
	fileSize: integer('file_size').notNull(),
	uploadType: text('upload_type').notNull(), // 'profile', 'id', 'certification', etc.
	url: text('url').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Rate limit table for better-auth
export const rateLimits = pgTable('rate_limits', {
	id: uuid('id').primaryKey().defaultRandom(),
	key: text('key').notNull().unique(),
	points: integer('points').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Verifications table for better-auth (required even without email/password auth)
export const verifications = pgTable('verifications', {
	id: uuid('id').primaryKey().defaultRandom(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

// Continents table
export const continents = pgTable(
	'continents',
	{
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 50 }).notNull().unique(),
		code: varchar('code', { length: 2 }).notNull().unique(), // AF, AS, EU, NA, SA, OC, AN
		created_at: timestamp('created_at').defaultNow().notNull(),
		updated_at: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		nameIdx: index('continents_name_idx').on(table.name),
		codeIdx: index('continents_code_idx').on(table.code)
	})
);

// Countries table
export const countries = pgTable(
	'countries',
	{
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull().unique(),
		code: varchar('code', { length: 3 }).notNull().unique(), // ISO 3166-1 alpha-3
		continentId: integer('continent_id')
			.notNull()
			.references(() => continents.id, { onDelete: 'restrict' }),
		created_at: timestamp('created_at').defaultNow().notNull(),
		updated_at: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		nameIdx: index('countries_name_idx').on(table.name),
		codeIdx: index('countries_code_idx').on(table.code),
		continentIdIdx: index('countries_continent_id_idx').on(table.continentId)
	})
);

// Destinations table - now references countries
export const destinations = pgTable(
	'destinations',
	{
		id: serial('id').primaryKey(),
		city: varchar('city', { length: 100 }).notNull(),
		countryId: integer('country_id')
			.notNull()
			.references(() => countries.id, { onDelete: 'restrict' }),
		imageUrl: text('image_url'),
		created_at: timestamp('created_at').defaultNow().notNull(),
		updated_at: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for search functionality
		cityIdx: index('destinations_city_idx').on(table.city),
		countryIdIdx: index('destinations_country_id_idx').on(table.countryId),
		// Unique constraint on city + country combination
		uniqueCityCountry: index('destinations_city_country_unique').on(table.city, table.countryId)
	})
);

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

export const trips = pgTable(
	'trips',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		destinationId: integer('destination_id')
			.notNull()
			.references(() => destinations.id, { onDelete: 'restrict' }),
		adultsCount: integer('adults_count').notNull().default(1),
		childrenCount: integer('children_count').notNull().default(0),
		babiesCount: integer('babies_count').notNull().default(0),
		startDate: timestamp('start_date').notNull(),
		endDate: timestamp('end_date').notNull(),
		budgetMin: integer('budget_min'),
		budgetMax: integer('budget_max'),
		travelStyle: varchar('travel_style', { length: 50 }),
		activities: jsonb('activities').$type<string[]>().default([]),
		additionalRequest: text('additional_request'),
		travelMethod: travelMethodEnum('travel_method'),
		customRequest: text('custom_request'),
		// Trip status tracking
		status: tripStatusEnum('status').notNull().default('draft'),
		statusUpdatedAt: timestamp('status_updated_at').defaultNow().notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for frequently queried columns
		userIdIdx: index('trips_user_id_idx').on(table.userId),
		statusIdx: index('trips_status_idx').on(table.status),
		destinationIdIdx: index('trips_destination_id_idx').on(table.destinationId)
	})
);

// Define enum for offer status
export const offerStatusEnum = pgEnum('offer_status', [
	'pending',
	'accepted',
	'rejected',
	'withdrawn'
]);
export type OfferStatus = (typeof offerStatusEnum.enumValues)[number];

export const offers = pgTable(
	'offers',
	{
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
		descriptionImages: text('description_images').array(), // Array of image URLs
		price: integer('price').notNull(), // in cents to avoid decimal issues
		currency: varchar('currency', { length: 3 }).notNull().default('USD'),
		duration: integer('duration'), // duration in hours
		maxParticipants: integer('max_participants'),
		itinerary: text('itinerary'), // rich text itinerary - new field
		status: offerStatusEnum('status').notNull().default('pending'),
		validUntil: timestamp('valid_until'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for frequently queried columns
		guideIdIdx: index('offers_guide_id_idx').on(table.guideId),
		tripIdIdx: index('offers_trip_id_idx').on(table.tripId),
		statusIdx: index('offers_status_idx').on(table.status),
		guideStatusIdx: index('offers_guide_status_idx').on(table.guideId, table.status)
	})
);

export const tripStatusHistory = pgTable('trip_status_history', {
	id: uuid('id').primaryKey().defaultRandom(),
	tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
	status: tripStatusEnum('status').notNull(),
	changedAt: timestamp('changed_at').defaultNow().notNull(),
	changedBy: uuid('changed_by').references(() => users.id)
});

// Define enum for payment status
export const paymentStatusEnum = pgEnum('payment_status', [
	'pending',
	'processing',
	'completed',
	'failed',
	'cancelled',
	'refunded'
]);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

// Payments table
export const payments = pgTable(
	'payments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tripId: uuid('trip_id')
			.notNull()
			.references(() => trips.id, { onDelete: 'restrict' }),
		offerId: uuid('offer_id')
			.notNull()
			.references(() => offers.id, { onDelete: 'restrict' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		amount: integer('amount').notNull(), // Amount in KRW
		currency: varchar('currency', { length: 3 }).notNull().default('KRW'),
		paymentKey: text('payment_key').notNull().unique(), // Toss Payments key
		orderId: text('order_id').notNull().unique(),
		status: paymentStatusEnum('status').notNull().default('pending'),
		paymentMethod: text('payment_method'), // card, transfer, etc.
		failureReason: text('failure_reason'),
		paidAt: timestamp('paid_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for frequently queried columns
		userIdIdx: index('payments_user_id_idx').on(table.userId),
		tripIdIdx: index('payments_trip_id_idx').on(table.tripId),
		offerIdIdx: index('payments_offer_id_idx').on(table.offerId),
		statusIdx: index('payments_status_idx').on(table.status),
		paymentKeyIdx: index('payments_payment_key_idx').on(table.paymentKey)
	})
);

// Define enum for conversation status
export const conversationStatusEnum = pgEnum('conversation_status', [
	'active',
	'archived',
	'blocked'
]);

// Message type enum
export const messageTypeEnum = pgEnum('message_type', [
	'text',
	'cancellation_request',
	'cancellation_response'
]);
export type ConversationStatus = (typeof conversationStatusEnum.enumValues)[number];

// Conversations table for chat between travelers and guides
export const conversations = pgTable(
	'conversations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		offerId: uuid('offer_id')
			.notNull()
			.references(() => offers.id, { onDelete: 'cascade' })
			.unique(), // One conversation per offer
		travelerId: uuid('traveler_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		guideId: uuid('guide_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		status: conversationStatusEnum('status').notNull().default('active'),
		lastMessageAt: timestamp('last_message_at'),
		travelerLastReadAt: timestamp('traveler_last_read_at'),
		guideLastReadAt: timestamp('guide_last_read_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for frequently queried columns
		offerIdIdx: index('conversations_offer_id_idx').on(table.offerId),
		travelerIdIdx: index('conversations_traveler_id_idx').on(table.travelerId),
		guideIdIdx: index('conversations_guide_id_idx').on(table.guideId),
		statusIdx: index('conversations_status_idx').on(table.status),
		lastMessageIdx: index('conversations_last_message_idx').on(table.lastMessageAt)
	})
);

// Messages table for individual messages in conversations
export const messages = pgTable(
	'messages',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		conversationId: uuid('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		senderId: uuid('sender_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		messageType: messageTypeEnum('message_type').notNull().default('text'),
		metadata: jsonb('metadata').$type<Record<string, any>>(),
		isEdited: boolean('is_edited').notNull().default(false),
		editedAt: timestamp('edited_at'),
		isDeleted: boolean('is_deleted').notNull().default(false),
		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for frequently queried columns
		conversationIdIdx: index('messages_conversation_id_idx').on(table.conversationId),
		senderIdIdx: index('messages_sender_id_idx').on(table.senderId),
		createdAtIdx: index('messages_created_at_idx').on(table.createdAt)
	})
);

// Reviews table for traveler reviews of guides after trip completion
export const reviews = pgTable(
	'reviews',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		tripId: uuid('trip_id')
			.notNull()
			.references(() => trips.id, { onDelete: 'cascade' }),
		offerId: uuid('offer_id')
			.notNull()
			.references(() => offers.id, { onDelete: 'cascade' }),
		guideId: uuid('guide_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		travelerId: uuid('traveler_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		rating: integer('rating').notNull(), // 1-5 stars
		content: text('content').notNull(),
		images: text('images').$type<string[]>().array(), // Array of image URLs
		tags: text('tags').$type<string[]>().array(), // Array of selected tags
		reviewToken: text('review_token').unique(), // Unique token for review links
		reviewRequestedAt: timestamp('review_requested_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		// Add indexes for frequently queried columns
		guideIdIdx: index('reviews_guide_id_idx').on(table.guideId),
		tripIdIdx: index('reviews_trip_id_idx').on(table.tripId),
		travelerIdIdx: index('reviews_traveler_id_idx').on(table.travelerId),
		ratingIdx: index('reviews_rating_idx').on(table.rating),
		reviewTokenIdx: index('reviews_review_token_idx').on(table.reviewToken),
		// Ensure one review per trip
		uniqueTripReview: index('reviews_trip_traveler_unique').on(table.tripId, table.travelerId)
	})
);

// Type exports for admin tables
export type Admin = typeof admins.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;

// Type exports for main tables
export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Destination = typeof destinations.$inferSelect;
export type Country = typeof countries.$inferSelect;
export type Continent = typeof continents.$inferSelect;

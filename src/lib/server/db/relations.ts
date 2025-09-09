import { relations } from 'drizzle-orm';
import {
	users,
	trips,
	offers,
	continents,
	countries,
	destinations,
	reviews,
	conversations,
	messages,
	guideProfiles,
	travelerProfiles,
	sessions,
	accounts,
	fileUploads,
	userAgreements,
	tripStatusHistory,
	payments,
	products,
	productOffers,
	settlements
} from './schema';

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
	trips: many(trips),
	offersAsGuide: many(offers, {
		relationName: 'guideOffers'
	}),
	offersAsTraveler: many(offers, {
		relationName: 'travelerOffers'
	}),
	reviewsAsGuide: many(reviews, {
		relationName: 'guideReviews'
	}),
	reviewsAsTraveler: many(reviews, {
		relationName: 'travelerReviews'
	}),
	conversationsAsTraveler: many(conversations, {
		relationName: 'travelerConversations'
	}),
	conversationsAsGuide: many(conversations, {
		relationName: 'guideConversations'
	}),
	messages: many(messages),
	sessions: many(sessions),
	accounts: many(accounts),
	fileUploads: many(fileUploads),
	payments: many(payments),
	guideProfile: one(guideProfiles, {
		fields: [users.id],
		references: [guideProfiles.userId]
	}),
	travelerProfile: one(travelerProfiles, {
		fields: [users.id],
		references: [travelerProfiles.userId]
	}),
	userAgreement: one(userAgreements, {
		fields: [users.id],
		references: [userAgreements.userId]
	}),
	tripStatusChanges: many(tripStatusHistory)
}));

// Trip relations
export const tripsRelations = relations(trips, ({ one, many }) => ({
	user: one(users, {
		fields: [trips.userId],
		references: [users.id]
	}),
	destination: one(destinations, {
		fields: [trips.destinationId],
		references: [destinations.id]
	}),
	offers: many(offers),
	reviews: many(reviews),
	payments: many(payments),
	statusHistory: many(tripStatusHistory)
}));

// Offer relations
export const offersRelations = relations(offers, ({ one, many }) => ({
	trip: one(trips, {
		fields: [offers.tripId],
		references: [trips.id]
	}),
	guide: one(users, {
		fields: [offers.guideId],
		references: [users.id],
		relationName: 'guideOffers'
	}),
	traveler: one(users, {
		fields: [offers.travelerId],
		references: [users.id],
		relationName: 'travelerOffers'
	}),
	reviews: many(reviews),
	conversations: many(conversations),
	payments: many(payments)
}));

// Continent relations
export const continentsRelations = relations(continents, ({ many }) => ({
	countries: many(countries)
}));

// Country relations
export const countriesRelations = relations(countries, ({ one, many }) => ({
	continent: one(continents, {
		fields: [countries.continentId],
		references: [continents.id]
	}),
	destinations: many(destinations)
}));

// Destination relations
export const destinationsRelations = relations(destinations, ({ one, many }) => ({
	country: one(countries, {
		fields: [destinations.countryId],
		references: [countries.id]
	}),
	trips: many(trips)
}));

// Review relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
	trip: one(trips, {
		fields: [reviews.tripId],
		references: [trips.id]
	}),
	offer: one(offers, {
		fields: [reviews.offerId],
		references: [offers.id]
	}),
	guide: one(users, {
		fields: [reviews.guideId],
		references: [users.id],
		relationName: 'guideReviews'
	}),
	traveler: one(users, {
		fields: [reviews.travelerId],
		references: [users.id],
		relationName: 'travelerReviews'
	})
}));

// Conversation relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
	offer: one(offers, {
		fields: [conversations.offerId],
		references: [offers.id]
	}),
	traveler: one(users, {
		fields: [conversations.travelerId],
		references: [users.id],
		relationName: 'travelerConversations'
	}),
	guide: one(users, {
		fields: [conversations.guideId],
		references: [users.id],
		relationName: 'guideConversations'
	}),
	messages: many(messages)
}));

// Message relations
export const messagesRelations = relations(messages, ({ one }) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	sender: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	})
}));

// Guide Profile relations
export const guideProfilesRelations = relations(guideProfiles, ({ one }) => ({
	user: one(users, {
		fields: [guideProfiles.userId],
		references: [users.id]
	})
}));

// Traveler Profile relations
export const travelerProfilesRelations = relations(travelerProfiles, ({ one }) => ({
	user: one(users, {
		fields: [travelerProfiles.userId],
		references: [users.id]
	})
}));

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

// Account relations
export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	})
}));

// File Upload relations
export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
	user: one(users, {
		fields: [fileUploads.userId],
		references: [users.id]
	})
}));

// User Agreement relations
export const userAgreementsRelations = relations(userAgreements, ({ one }) => ({
	user: one(users, {
		fields: [userAgreements.userId],
		references: [users.id]
	})
}));

// Trip Status History relations
export const tripStatusHistoryRelations = relations(tripStatusHistory, ({ one }) => ({
	trip: one(trips, {
		fields: [tripStatusHistory.tripId],
		references: [trips.id]
	}),
	changedBy: one(users, {
		fields: [tripStatusHistory.changedBy],
		references: [users.id]
	})
}));

// Payment relations
export const paymentsRelations = relations(payments, ({ one }) => ({
	trip: one(trips, {
		fields: [payments.tripId],
		references: [trips.id]
	}),
	offer: one(offers, {
		fields: [payments.offerId],
		references: [offers.id]
	}),
	user: one(users, {
		fields: [payments.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [payments.productId],
		references: [products.id]
	}),
	productOffer: one(productOffers, {
		fields: [payments.productOfferId],
		references: [productOffers.id]
	}),
	settlement: one(settlements, {
		fields: [payments.id],
		references: [settlements.paymentId]
	})
}));

// Settlement relations
export const settlementsRelations = relations(settlements, ({ one }) => ({
	payment: one(payments, {
		fields: [settlements.paymentId],
		references: [payments.id]
	}),
	settledByAdmin: one(admins, {
		fields: [settlements.settledBy],
		references: [admins.id]
	})
}));

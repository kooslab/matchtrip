# Cancellation and Refund Policy Implementation

## Overview

The MatchTrip platform implements a comprehensive cancellation and refund system that handles both trip-based and product-based bookings. The system uses database-driven refund policies that can be configured through the admin panel.

## Refund Policy Rules

### Guide Cancellations
**IMPORTANT**: When a guide cancels any booking (trip or product), the traveler **ALWAYS** receives a 100% refund, regardless of:
- How many days before the trip/product date
- Whether the trip has already started or ended
- Any other circumstances

This is a platform policy to protect travelers from guide-initiated cancellations.

### Traveler Cancellations
Refunds for traveler-initiated cancellations are based on the timing of the cancellation relative to the trip/product start date:

#### Standard Refund Percentages (Configurable via Admin Panel)
The default configuration is:
- **40+ days before**: 100% refund
- **30-39 days before**: 90% refund  
- **20-29 days before**: 85% refund
- **10-19 days before**: 80% refund
- **Less than 10 days**: Varies based on admin configuration

#### Exception Cases
The following reasons qualify for potential 100% refund but require admin approval:
- Natural disaster (`natural_disaster`)
- Medical emergency (`medical_emergency`)

#### Past Trips/Products
If a traveler attempts to cancel after the trip/product date has passed:
- Requires admin review and approval
- Admin determines the appropriate refund amount
- Initial refund amount is set to 0 pending review

## Technical Implementation

### Database Schema

#### `refund_policies` Table
Stores configurable refund policies with the following fields:
- `daysBeforeStart`: Start of the day range
- `daysBeforeEnd`: End of the day range (null = infinity)
- `refundPercentage`: Percentage to refund (0-100)
- `applicableTo`: Either 'trip' or 'product'
- `isActive`: Whether the policy is currently active

### Key Components

#### 1. Refund Calculator (`/lib/utils/refundCalculator.ts`)
- `fetchRefundPolicies(policyType)`: Fetches active policies from database
- `calculateRefundAmount(params)`: Calculates refund based on:
  - Requester type (traveler/guide)
  - Days before trip/product
  - Configured policies
  - Exception reasons

#### 2. Cancellation Service (`/lib/server/services/cancellation.ts`)
- `createCancellationRequest()`: Creates a new cancellation request
- `processCancellation()`: Admin processes approval/rejection
- `processCancellationApproval()`: Handles approved cancellations

### Cancellation Flow

#### 1. Guide Cancels Trip/Product
```typescript
1. Guide initiates cancellation
2. System calculates 100% refund (automatic)
3. Cancellation auto-approved
4. Payment status → 'cancelled'
5. Offer/ProductOffer status updated
6. Refund processed via Toss Payments
7. Traveler receives full refund
```

#### 2. Traveler Cancels Trip/Product
```typescript
1. Traveler initiates cancellation with reason
2. System fetches refund policies from database
3. Calculates refund percentage based on timing
4. If exception case → requires admin approval
5. If standard case → auto-processes refund
6. Updates payment and booking statuses
7. Processes refund via Toss Payments
```

### Status Updates

When a cancellation is processed:
- **Offers** (trip-based): Status changes to `'withdrawn'`
- **ProductOffers**: Status changes to `'rejected'`
- **Trips**: Status reverts to `'submitted'` (available for new offers)
- **Payments**: Status changes to `'cancelled'` with refund amount recorded

### Integration with Toss Payments

1. **Refund Processing**: Via Toss Payments API (`/v1/payments/{paymentKey}/cancel`)
2. **Webhook Handling**: `/api/webhooks/toss` receives confirmation
3. **Database Updates**: Payment and refund records updated upon webhook confirmation

## Configuration

### Admin Panel Settings
Administrators can configure refund policies through `/admin/refund-policies`:
- Set different policies for trips vs products
- Define day ranges and refund percentages
- Activate/deactivate policies
- Policies cannot have overlapping date ranges

### Environment Variables
No specific environment variables needed for refund policies (uses database configuration)

## Important Notes

1. **Database-First**: The system prioritizes database policies over hardcoded values
2. **Fallback Logic**: If no database policies exist, falls back to hardcoded defaults
3. **Guide Protection**: Guide cancellations always result in 100% refund to protect travelers
4. **Admin Override**: Admins can override calculated refund amounts when processing requests
5. **Audit Trail**: All cancellations and refunds are tracked in the database with timestamps and user IDs
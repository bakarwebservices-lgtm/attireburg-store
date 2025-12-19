# Design Document

## Overview

The Backorder and Pre-order System extends the existing e-commerce platform to handle out-of-stock scenarios gracefully. The system provides two main customer-facing features: waitlist notifications for stock alerts and backorder purchasing for guaranteed fulfillment. The design integrates seamlessly with the existing product variant management system and inventory service.

## Architecture

The system follows a layered architecture pattern:

- **Presentation Layer**: React components for customer and admin interfaces
- **API Layer**: Next.js API routes for backorder and notification management
- **Service Layer**: Business logic services for waitlist, backorder, and notification management
- **Data Layer**: PostgreSQL database with Prisma ORM for data persistence
- **External Services**: Email service integration for customer notifications

The architecture maintains separation of concerns while integrating with existing inventory management and order processing systems.

## Components and Interfaces

### Core Services

**BackorderService**
- Manages backorder creation, fulfillment, and cancellation
- Integrates with existing inventory service for stock allocation
- Handles automatic fulfillment when inventory is restocked

**WaitlistService**
- Manages customer waitlist subscriptions
- Processes restock notifications
- Handles waitlist analytics and reporting

**NotificationService**
- Sends email notifications for restock alerts
- Manages notification templates and scheduling
- Handles notification preferences and unsubscribe functionality

**RestockService**
- Manages expected restock dates
- Triggers notifications when items become available
- Handles automatic backorder fulfillment

### API Endpoints

```typescript
// Waitlist Management
POST /api/waitlist/subscribe
DELETE /api/waitlist/unsubscribe
GET /api/waitlist/subscriptions

// Backorder Management
POST /api/backorders/create
GET /api/backorders/status
PUT /api/backorders/cancel

// Admin Endpoints
GET /api/admin/backorders
PUT /api/admin/backorders/fulfill
GET /api/admin/waitlists
POST /api/admin/restock-dates

// Notification Endpoints
POST /api/notifications/restock
GET /api/notifications/status
```

## Data Models

### Database Schema Extensions

```sql
-- Waitlist subscriptions
CREATE TABLE WaitlistSubscription (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  userId TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now(),
  FOREIGN KEY (productId) REFERENCES Product(id),
  FOREIGN KEY (variantId) REFERENCES ProductVariant(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Restock notifications tracking
CREATE TABLE RestockNotification (
  id TEXT PRIMARY KEY,
  waitlistSubscriptionId TEXT NOT NULL,
  sentAt TIMESTAMP DEFAULT now(),
  emailOpened BOOLEAN DEFAULT false,
  linkClicked BOOLEAN DEFAULT false,
  purchaseCompleted BOOLEAN DEFAULT false,
  FOREIGN KEY (waitlistSubscriptionId) REFERENCES WaitlistSubscription(id)
);

-- Expected restock dates
CREATE TABLE RestockSchedule (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  variantId TEXT,
  expectedDate TIMESTAMP,
  actualDate TIMESTAMP,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now(),
  FOREIGN KEY (productId) REFERENCES Product(id),
  FOREIGN KEY (variantId) REFERENCES ProductVariant(id)
);

-- Enhanced Order model for backorders
ALTER TABLE Order ADD COLUMN orderType TEXT DEFAULT 'standard';
ALTER TABLE Order ADD COLUMN expectedFulfillmentDate TIMESTAMP;
ALTER TABLE Order ADD COLUMN backorderPriority INTEGER;
```

### TypeScript Interfaces

```typescript
interface WaitlistSubscription {
  id: string
  email: string
  productId: string
  variantId?: string
  userId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface BackorderInfo {
  orderId: string
  orderType: 'backorder' | 'preorder'
  expectedFulfillmentDate?: Date
  priority: number
  status: 'pending' | 'fulfilled' | 'cancelled'
}

interface RestockSchedule {
  id: string
  productId: string
  variantId?: string
  expectedDate?: Date
  actualDate?: Date
  notes?: string
}

interface NotificationTemplate {
  type: 'restock' | 'delay' | 'fulfillment'
  subject: string
  htmlContent: string
  textContent: string
}
```## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 1.1 and 2.1 both test UI display for out-of-stock items - can be combined into one comprehensive property
- Properties 1.4, 3.3, 5.2, and 6.4 all test notification sending - can be consolidated into notification consistency properties
- Properties 4.2, 4.4, 6.2, and 7.2 all test information display - can be combined into display completeness properties
- Properties 8.1 and 8.2 both test allocation logic - can be combined into allocation ordering property

### Core Properties

**Property 1: Out-of-stock UI consistency**
*For any* product variant that is out of stock, the system should display both "Notify When Available" and "Backorder" options consistently across all product pages
**Validates: Requirements 1.1, 2.1**

**Property 2: Waitlist subscription persistence**
*For any* customer interaction with "Notify When Available", the system should create a waitlist subscription that persists in the database and reflects in the UI
**Validates: Requirements 1.2, 1.3**

**Property 3: Notification delivery consistency**
*For any* restock event, expected date change, or fulfillment update, the system should send notifications to all relevant waitlisted customers within the specified timeframe
**Validates: Requirements 1.4, 3.3, 5.2, 6.1, 6.4**

**Property 4: Authentication-based email usage**
*For any* logged-in customer, waitlist registration should automatically use their account email without requiring re-entry
**Validates: Requirements 1.5**

**Property 5: Backorder creation completeness**
*For any* backorder placement, the system should process payment, create an order with "backorder" status, and provide estimated fulfillment date
**Validates: Requirements 2.2, 2.3**

**Property 6: FIFO fulfillment ordering**
*For any* inventory restock event, backorders should be fulfilled in chronological order (oldest first) until inventory is exhausted
**Validates: Requirements 2.4, 8.1, 8.2**

**Property 7: Delay notification and cancellation**
*For any* backorder that exceeds its estimated fulfillment date, the system should notify the customer and offer cancellation options
**Validates: Requirements 2.5**

**Property 8: Restock date display logic**
*For any* out-of-stock product, the system should display the expected restock date if available, or "Restock date to be determined" if not available
**Validates: Requirements 3.1, 3.2**

**Property 9: Date management automation**
*For any* expected restock date that passes without restocking, the system should automatically update or remove the date
**Validates: Requirements 3.4**

**Property 10: Variant-specific restock dates**
*For any* product with multiple variants, each variant should have independent restock date management and display
**Validates: Requirements 3.5**

**Property 11: Admin interface completeness**
*For any* admin accessing backorder management, the interface should display all required information including order details, customer information, and fulfillment dates
**Validates: Requirements 4.2, 4.3, 4.4**

**Property 12: Analytics generation**
*For any* scenario where waitlist demand exceeds available inventory, the system should generate analytics data for purchasing decisions
**Validates: Requirements 4.5**

**Property 13: Date validation**
*For any* restock date input, the system should validate that the date is in the future before accepting it
**Validates: Requirements 5.4**

**Property 14: Inventory-triggered date clearing**
*For any* inventory receipt event, the system should automatically clear associated expected restock dates
**Validates: Requirements 5.3**

**Property 15: Bulk operations consistency**
*For any* bulk restock date update operation, all selected products should be updated simultaneously and consistently
**Validates: Requirements 5.5**

**Property 16: Notification content completeness**
*For any* restock notification sent, the email should include product details, current price, and a functional purchase link
**Validates: Requirements 6.2**

**Property 17: Temporary reservation functionality**
*For any* customer clicking a notification purchase link, the item should be reserved for exactly 30 minutes
**Validates: Requirements 6.3**

**Property 18: Notification consolidation**
*For any* customer with multiple waitlisted items becoming available simultaneously, notifications should be consolidated when possible
**Validates: Requirements 6.5**

**Property 19: Customer waitlist management**
*For any* customer accessing their account, all active waitlist subscriptions should be displayed with complete product and date information
**Validates: Requirements 7.1, 7.2**

**Property 20: Unsubscribe functionality**
*For any* customer unsubscribe action (via account or email link), the waitlist subscription should be immediately removed and no further notifications sent
**Validates: Requirements 7.3, 7.4, 7.5**

**Property 21: Fulfillment process completeness**
*For any* backorder fulfillment, the system should update order status and send shipping notifications
**Validates: Requirements 8.3**

**Property 22: Cancellation inventory restoration**
*For any* backorder cancellation, allocated inventory should be immediately made available to other customers
**Validates: Requirements 8.4**

**Property 23: Partial fulfillment handling**
*For any* backorder that can only be partially fulfilled, the remaining quantity should be maintained as an active backorder with updated quantities
**Validates: Requirements 8.5**

## Error Handling

The system implements comprehensive error handling across all layers:

### Database Errors
- Transaction rollback for failed inventory operations
- Constraint violation handling for duplicate subscriptions
- Connection timeout and retry logic

### Email Service Errors
- Retry mechanism for failed notification deliveries
- Fallback notification methods (in-app notifications)
- Dead letter queue for persistent failures

### Payment Processing Errors
- Backorder payment failure handling
- Refund processing for cancelled backorders
- Payment method validation

### Inventory Conflicts
- Race condition handling for simultaneous stock updates
- Overselling prevention through atomic operations
- Stock reservation timeout management

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Testing**
- Specific examples of backorder creation and fulfillment
- Edge cases like zero inventory and expired dates
- Integration points between services
- Error condition handling

**Property-Based Testing**
- Universal properties across all customer interactions
- Inventory consistency across concurrent operations
- Notification delivery reliability
- FIFO ordering correctness

**Property-Based Testing Framework**
- **Library**: fast-check for TypeScript/JavaScript property-based testing
- **Configuration**: Minimum 100 iterations per property test
- **Tagging**: Each property test tagged with format: '**Feature: backorder-preorder-system, Property {number}: {property_text}**'
- **Implementation**: Each correctness property implemented by a single property-based test

**Testing Requirements**
- Property tests verify universal behaviors across all valid inputs
- Unit tests catch specific bugs and validate concrete examples
- Integration tests ensure proper service interaction
- Performance tests validate notification delivery timing
- End-to-end tests verify complete customer workflows

The testing strategy ensures that both specific scenarios and general system behaviors are thoroughly validated, providing confidence in the system's correctness and reliability.
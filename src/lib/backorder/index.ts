// Backorder System Services
export { WaitlistService } from './WaitlistService'
export { BackorderService } from './BackorderService'
export { RestockService } from './RestockService'
export { NotificationService } from './NotificationService'
export { InventoryMonitor } from './InventoryMonitor'

// Type exports
export type { WaitlistSubscriptionData, WaitlistAnalytics } from './WaitlistService'
export type { BackorderData, BackorderInfo } from './BackorderService'
export type { RestockScheduleData, RestockEvent } from './RestockService'
export type { 
  NotificationTemplate, 
  RestockNotificationData, 
  DelayNotificationData, 
  FulfillmentNotificationData 
} from './NotificationService'
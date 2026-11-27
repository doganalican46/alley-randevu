export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'TENANT_ACCESS_DENIED'
  | 'APPOINTMENT_CONFLICT'
  | 'APPOINTMENT_NOT_AVAILABLE'
  | 'SUBSCRIPTION_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'PAYMENT_ERROR'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

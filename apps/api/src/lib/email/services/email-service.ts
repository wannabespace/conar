/**
 * Email service interface
 * We can implement multiple email services (like SendGrid, Resend, etc.) by implementing this interface
 * In future we can add more methods like sendBulkEmail(batches), etc.
 */
export interface EmailService {
  sendEmail: (email: string, subjectLine: string, template: string) => Promise<void>
}

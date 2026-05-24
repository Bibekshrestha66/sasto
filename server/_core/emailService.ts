import { getDb } from "../db";
import { emailQueue, emailLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  templateData?: Record<string, any>;
  userId?: number;
}

/**
 * Email service for sending transactional emails
 * Uses Resend API (or can be configured for SendGrid, AWS SES, etc.)
 */
export class EmailService {
  private apiKey: string;
  private fromEmail: string = "noreply@sastobazaar.com";
  private maxRetries: number = 3;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    if (!this.apiKey) {
      console.warn("RESEND_API_KEY not configured. Email sending will be disabled.");
    }
  }

  /**
   * Queue an email for sending
   */
  async queueEmail(options: SendEmailOptions): Promise<number> {
    const db = await getDb();

    const result = await db.insert(emailQueue).values({
      userId: options.userId || 0,
      recipientEmail: options.to,
      subject: options.subject,
      template: options.template,
      templateData: options.templateData ? JSON.stringify(options.templateData) : null,
      status: "pending",
      attemptCount: 0,
    }).returning();

    return result[0].id;
  }

  /**
   * Send email immediately
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const template = this.getTemplate(options.template, options.templateData || {});

      if (!this.apiKey) {
        console.log(`[EMAIL] Would send to ${options.to}: ${template.subject}`);
        return true;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email API error: ${response.statusText}`);
      }

      // Log successful send
      await this.logEmail({
        recipientEmail: options.to,
        subject: options.subject,
        template: options.template,
        status: "sent",
      });

      return true;
    } catch (error) {
      console.error("Email send error:", error);
      return false;
    }
  }

  /**
   * Process pending emails from queue
   */
  async processPendingEmails(): Promise<void> {
    const db = await getDb();

    const pending = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, "pending"))
      .limit(10);

    for (const email of pending) {
      try {
        const templateData = email.templateData ? JSON.parse(email.templateData) : {};
        const template = this.getTemplate(email.template, templateData);

        if (!this.apiKey) {
          console.log(`[EMAIL] Would send to ${email.recipientEmail}: ${template.subject}`);
          await db
            .update(emailQueue)
            .set({ status: "sent", sentAt: new Date() })
            .where(eq(emailQueue.id, email.id));
          continue;
        }

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: email.recipientEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          }),
        });

        if (response.ok) {
          await db
            .update(emailQueue)
            .set({ status: "sent", sentAt: new Date() })
            .where(eq(emailQueue.id, email.id));

          await this.logEmail({
            emailQueueId: email.id,
            recipientEmail: email.recipientEmail,
            subject: email.subject,
            template: email.template,
            status: "sent",
          });
        } else {
          const newAttemptCount = (email.attemptCount || 0) + 1;
          if (newAttemptCount >= this.maxRetries) {
            await db
              .update(emailQueue)
              .set({
                status: "failed",
                attemptCount: newAttemptCount,
                lastAttemptAt: new Date(),
                errorMessage: `Failed after ${newAttemptCount} attempts`,
              })
              .where(eq(emailQueue.id, email.id));
          } else {
            await db
              .update(emailQueue)
              .set({
                attemptCount: newAttemptCount,
                lastAttemptAt: new Date(),
              })
              .where(eq(emailQueue.id, email.id));
          }
        }
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        const newAttemptCount = (email.attemptCount || 0) + 1;
        await db
          .update(emailQueue)
          .set({
            attemptCount: newAttemptCount,
            lastAttemptAt: new Date(),
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(emailQueue.id, email.id));
      }
    }
  }

  /**
   * Log email activity
   */
  private async logEmail(data: {
    emailQueueId?: number;
    recipientEmail: string;
    subject: string;
    template: string;
    status: "sent" | "failed" | "bounced" | "opened" | "clicked";
    failureReason?: string;
  }): Promise<void> {
    const db = await getDb();
    await db.insert(emailLogs).values({
      emailQueueId: data.emailQueueId,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      template: data.template,
      status: data.status,
      failureReason: data.failureReason,
    });
  }

  /**
   * Get email template
   */
  private getTemplate(
    templateName: string,
    data: Record<string, any>
  ): EmailTemplate {
    const templates: Record<string, (data: Record<string, any>) => EmailTemplate> = {
      new_message: (data) => ({
        subject: `New message from ${data.senderName}`,
        html: `
          <h2>You have a new message</h2>
          <p>From: <strong>${data.senderName}</strong></p>
          <p>${data.messagePreview}</p>
          <a href="${data.messageLink}">View Message</a>
        `,
        text: `New message from ${data.senderName}: ${data.messagePreview}`,
      }),
      new_bid: (data) => ({
        subject: `New bid on your listing: ${data.listingTitle}`,
        html: `
          <h2>You have a new bid!</h2>
          <p>Listing: <strong>${data.listingTitle}</strong></p>
          <p>Bid Amount: <strong>Rs. ${data.bidAmount}</strong></p>
          <p>From: <strong>${data.bidderName}</strong></p>
          <a href="${data.listingLink}">View Bid</a>
        `,
        text: `New bid of Rs. ${data.bidAmount} on ${data.listingTitle}`,
      }),
      booking_confirmation: (data) => ({
        subject: `Booking Confirmation: ${data.listingTitle}`,
        html: `
          <h2>Booking Confirmed</h2>
          <p>Listing: <strong>${data.listingTitle}</strong></p>
          <p>Check-in: ${data.checkInDate}</p>
          <p>Check-out: ${data.checkOutDate}</p>
          <p>Total Price: <strong>Rs. ${data.totalPrice}</strong></p>
          <a href="${data.bookingLink}">View Booking</a>
        `,
        text: `Booking confirmed for ${data.listingTitle}`,
      }),
      listing_approved: (data) => ({
        subject: `Your listing has been approved: ${data.listingTitle}`,
        html: `
          <h2>Listing Approved!</h2>
          <p>Your listing <strong>${data.listingTitle}</strong> has been approved and is now live.</p>
          <a href="${data.listingLink}">View Listing</a>
        `,
        text: `Your listing ${data.listingTitle} has been approved`,
      }),
      listing_rejected: (data) => ({
        subject: `Your listing was rejected: ${data.listingTitle}`,
        html: `
          <h2>Listing Rejected</h2>
          <p>Your listing <strong>${data.listingTitle}</strong> was rejected.</p>
          <p>Reason: ${data.rejectionReason}</p>
          <a href="${data.editLink}">Edit Listing</a>
        `,
        text: `Your listing ${data.listingTitle} was rejected. Reason: ${data.rejectionReason}`,
      }),
      password_reset: (data) => ({
        subject: "Reset your password",
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${data.resetLink}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
        text: `Reset your password: ${data.resetLink}`,
      }),
      account_verification: (data) => ({
        subject: "Verify your email address",
        html: `
          <h2>Verify Your Email</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${data.verificationLink}">Verify Email</a>
        `,
        text: `Verify your email: ${data.verificationLink}`,
      }),
      weekly_digest: (data) => ({
        subject: "Your weekly marketplace digest",
        html: `
          <h2>Weekly Digest</h2>
          <p>Here's what happened this week:</p>
          <p>New messages: ${data.newMessagesCount}</p>
          <p>New bids: ${data.newBidsCount}</p>
          <p>Bookings: ${data.bookingsCount}</p>
          <a href="${data.dashboardLink}">View Dashboard</a>
        `,
        text: `Weekly digest: ${data.newMessagesCount} messages, ${data.newBidsCount} bids`,
      }),
      security_alert: (data) => ({
        subject: "Security alert: Unusual activity",
        html: `
          <h2>Security Alert</h2>
          <p>We detected unusual activity on your account.</p>
          <p>Activity: ${data.activityDescription}</p>
          <p>If this wasn't you, please change your password immediately.</p>
          <a href="${data.securityLink}">Manage Security</a>
        `,
        text: `Security alert: ${data.activityDescription}`,
      }),
      welcome_email: (data) => ({
        subject: "Welcome to Sasto Marketplace!",
        html: `
          <h2>Welcome to Sasto Marketplace, ${data.userName}!</h2>
          <p>We're excited to have you on board. Start exploring the marketplace now!</p>
          <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/marketplace">Browse Listings</a>
        `,
        text: `Welcome to Sasto Marketplace, ${data.userName}!`,
      }),
      order_buyer_confirmation: (data) => ({
        subject: `Order Confirmed: ${data.orderId}`,
        html: `
          <h2>Thank you for your order!</h2>
          <p>Order ID: <strong>${data.orderId}</strong></p>
          <p>Product: <strong>${data.listingTitle}</strong></p>
          <p>Amount Paid: <strong>NPR ${data.amount}</strong></p>
          <p>Delivery Speed: <strong>${data.deliverySpeed} Delivery</strong> (Fee: NPR ${data.deliveryFee})</p>
          <p>Estimated Delivery: <strong>${data.estDeliveryDate}</strong></p>
          <p>Deliver To: <strong>${data.deliveryName}</strong>, ${data.deliveryAddress} (${data.deliveryPhone})</p>
          <p>Payment Method: <strong>${data.paymentMethod}</strong></p>
          ${data.statusUpdate ? `<p style="font-weight: bold; color: #16a34a; font-size: 16px;">Update: ${data.statusUpdate}</p>` : ""}
          <br/>
          <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/buyer/dashboard">Track Order in Buyer Dashboard</a>
        `,
        text: `Thank you for your order! Order ID: ${data.orderId}, Product: ${data.listingTitle}, Total: NPR ${data.amount}. Estimated Delivery: ${data.estDeliveryDate}.`,
      }),
      order_seller_notification: (data) => ({
        subject: `Product Sold: ${data.orderId}`,
        html: `
          <h2>Your product has been purchased!</h2>
          <p>Order ID: <strong>${data.orderId}</strong></p>
          <p>Product: <strong>${data.listingTitle}</strong></p>
          <p>Amount: <strong>NPR ${data.amount}</strong></p>
          <p>Delivery Speed: <strong>${data.deliverySpeed} Delivery</strong></p>
          <p>Delivery Contact: <strong>${data.deliveryName}</strong> (${data.deliveryPhone})</p>
          <p>Delivery Address: <strong>${data.deliveryAddress}</strong></p>
          <p>Payment Method Selected: <strong>${data.paymentMethod}</strong></p>
          <br/>
          <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/seller/dashboard">Manage Order in Seller Dashboard</a>
        `,
        text: `Your product has been purchased! Order ID: ${data.orderId}, Product: ${data.listingTitle}, Amount: NPR ${data.amount}. Please prepare it for ${data.deliverySpeed} Delivery to ${data.deliveryAddress}.`,
      }),
    };

    const template = templates[templateName];
    if (!template) {
      return {
        subject: "Notification",
        html: "<p>You have a notification</p>",
        text: "You have a notification",
      };
    }

    return template(data);
  }
}

// Export singleton instance
export const emailService = new EmailService();

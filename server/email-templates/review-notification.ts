export const reviewNotificationTemplate = (data: {
  sellerName: string;
  reviewerName: string;
  rating: number;
  title: string;
  comment: string;
  listingTitle: string;
  reviewUrl: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00AA44 0%, #00cc55 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
    .review-card { background: white; padding: 15px; border-left: 4px solid #00AA44; margin: 15px 0; }
    .stars { color: #ffc107; font-size: 18px; }
    .button { display: inline-block; background: #00AA44; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Review Received!</h2>
    </div>
    
    <div class="content">
      <p>Hi ${data.sellerName},</p>
      
      <p>You've received a new review from <strong>${data.reviewerName}</strong> on your listing <strong>"${data.listingTitle}"</strong>.</p>
      
      <div class="review-card">
        <div class="stars">${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}</div>
        <h3>${data.title}</h3>
        <p>${data.comment}</p>
      </div>
      
      <p>This review helps build trust with potential buyers. Consider responding to show your commitment to customer satisfaction.</p>
      
      <a href="${data.reviewUrl}" class="button">View & Respond to Review</a>
      
      <div class="footer">
        <p>Sasto Marketplace - Your trusted marketplace for buying and selling</p>
        <p>© 2026 Sasto Marketplace. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const reviewResponseTemplate = (data: {
  buyerName: string;
  sellerName: string;
  listingTitle: string;
  response: string;
  reviewUrl: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00AA44 0%, #00cc55 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
    .response-card { background: white; padding: 15px; border-left: 4px solid #00AA44; margin: 15px 0; }
    .button { display: inline-block; background: #00AA44; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Seller Response to Your Review</h2>
    </div>
    
    <div class="content">
      <p>Hi ${data.buyerName},</p>
      
      <p><strong>${data.sellerName}</strong> has responded to your review on <strong>"${data.listingTitle}"</strong>.</p>
      
      <div class="response-card">
        <p>${data.response}</p>
      </div>
      
      <p>Thank you for your feedback and helping improve our marketplace community!</p>
      
      <a href="${data.reviewUrl}" class="button">View Full Review & Response</a>
      
      <div class="footer">
        <p>Sasto Marketplace - Your trusted marketplace for buying and selling</p>
        <p>© 2026 Sasto Marketplace. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * CSV Export Utility Functions
 * Provides functions to export various marketplace data as CSV files
 */

interface ExportOptions {
  filename: string;
  headers: string[];
  data: Record<string, any>[];
}

/**
 * Convert array of objects to CSV format
 */
function convertToCSV(headers: string[], data: Record<string, any>[]): string {
  const csvHeaders = headers.map((h) => `"${h}"`).join(",");
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '""';
        if (typeof value === "string") {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      })
      .join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Trigger CSV file download
 */
function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export seller sales data as CSV
 */
export function exportSellerSalesData(
  sales: Array<{
    id: string;
    listingTitle: string;
    buyerName: string;
    amount: number;
    status: string;
    date: Date;
  }>
): void {
  const headers = ["Sale ID", "Listing Title", "Buyer Name", "Amount (NPR)", "Status", "Date"];
  const data = sales.map((sale) => ({
    "Sale ID": sale.id,
    "Listing Title": sale.listingTitle,
    "Buyer Name": sale.buyerName,
    "Amount (NPR)": sale.amount,
    Status: sale.status,
    Date: new Date(sale.date).toLocaleDateString(),
  }));

  const filename = `seller_sales_${new Date().toISOString().split("T")[0]}.csv`;
  const csv = convertToCSV(headers, data);
  downloadCSV(csv, filename);
}

/**
 * Export seller listings data as CSV
 */
export function exportSellerListingsData(
  listings: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
    status: string;
    views: number;
    createdAt: Date;
  }>
): void {
  const headers = ["Listing ID", "Title", "Category", "Price (NPR)", "Status", "Views", "Created Date"];
  const data = listings.map((listing) => ({
    "Listing ID": listing.id,
    Title: listing.title,
    Category: listing.category,
    "Price (NPR)": listing.price,
    Status: listing.status,
    Views: listing.views,
    "Created Date": new Date(listing.createdAt).toLocaleDateString(),
  }));

  const filename = `seller_listings_${new Date().toISOString().split("T")[0]}.csv`;
  const csv = convertToCSV(headers, data);
  downloadCSV(csv, filename);
}

/**
 * Export buyer purchase history as CSV
 */
export function exportBuyerPurchaseHistory(
  purchases: Array<{
    id: string;
    listingTitle: string;
    sellerName: string;
    amount: number;
    status: string;
    purchaseDate: Date;
  }>
): void {
  const headers = ["Purchase ID", "Listing Title", "Seller Name", "Amount (NPR)", "Status", "Purchase Date"];
  const data = purchases.map((purchase) => ({
    "Purchase ID": purchase.id,
    "Listing Title": purchase.listingTitle,
    "Seller Name": purchase.sellerName,
    "Amount (NPR)": purchase.amount,
    Status: purchase.status,
    "Purchase Date": new Date(purchase.purchaseDate).toLocaleDateString(),
  }));

  const filename = `purchase_history_${new Date().toISOString().split("T")[0]}.csv`;
  const csv = convertToCSV(headers, data);
  downloadCSV(csv, filename);
}

/**
 * Export buyer saved items as CSV
 */
export function exportBuyerSavedItems(
  items: Array<{
    id: string;
    title: string;
    sellerName: string;
    price: number;
    category: string;
    savedDate: Date;
  }>
): void {
  const headers = ["Item ID", "Title", "Seller Name", "Price (NPR)", "Category", "Saved Date"];
  const data = items.map((item) => ({
    "Item ID": item.id,
    Title: item.title,
    "Seller Name": item.sellerName,
    "Price (NPR)": item.price,
    Category: item.category,
    "Saved Date": new Date(item.savedDate).toLocaleDateString(),
  }));

  const filename = `saved_items_${new Date().toISOString().split("T")[0]}.csv`;
  const csv = convertToCSV(headers, data);
  downloadCSV(csv, filename);
}

/**
 * Export buyer active bids as CSV
 */
export function exportBuyerActiveBids(
  bids: Array<{
    id: string;
    listingTitle: string;
    sellerName: string;
    currentBid: number;
    yourBid: number;
    endTime: Date;
  }>
): void {
  const headers = ["Bid ID", "Listing Title", "Seller Name", "Current Bid (NPR)", "Your Bid (NPR)", "End Time"];
  const data = bids.map((bid) => ({
    "Bid ID": bid.id,
    "Listing Title": bid.listingTitle,
    "Seller Name": bid.sellerName,
    "Current Bid (NPR)": bid.currentBid,
    "Your Bid (NPR)": bid.yourBid,
    "End Time": new Date(bid.endTime).toLocaleString(),
  }));

  const filename = `active_bids_${new Date().toISOString().split("T")[0]}.csv`;
  const csv = convertToCSV(headers, data);
  downloadCSV(csv, filename);
}

/**
 * Export generic data as CSV
 */
export function exportDataAsCSV(options: ExportOptions): void {
  const csv = convertToCSV(options.headers, options.data);
  downloadCSV(csv, options.filename);
}

/**
 * Export flagged reviews as CSV
 */
export function exportFlaggedReviewsToCsv(
  reviews: Array<{
    id: number;
    reviewId: number;
    flaggedByUserId: number;
    reason: string;
    description: string | null;
    status: string;
    createdAt: Date | string;
  }>
): void {
  const headers = ["Flag ID", "Review ID", "Flagged By User ID", "Reason", "Description", "Status", "Date"];
  const data = reviews.map((review) => ({
    "Flag ID": review.id,
    "Review ID": review.reviewId,
    "Flagged By User ID": review.flaggedByUserId,
    Reason: review.reason,
    Description: review.description || "",
    Status: review.status,
    Date: new Date(review.createdAt).toLocaleDateString(),
  }));

  const filename = `flagged_reviews_${new Date().toISOString().split("T")[0]}.csv`;
  const csv = convertToCSV(headers, data);
  downloadCSV(csv, filename);
}

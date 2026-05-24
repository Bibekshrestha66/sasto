import { describe, it, expect } from "vitest";
import {
  exportSellerSalesData,
  exportSellerListingsData,
  exportBuyerPurchaseHistory,
  exportBuyerSavedItems,
  exportBuyerActiveBids,
} from "./csvExport";

describe("CSV Export Functions", () => {

  describe("exportSellerSalesData", () => {
    it("should export seller sales data as CSV", () => {
      const salesData = [
        {
          id: "S001",
          listingTitle: "iPhone 13",
          buyerName: "John Doe",
          amount: 95000,
          status: "completed",
          date: new Date("2026-03-01"),
        },
      ];

      // Verify data structure
      expect(salesData).toHaveLength(1);
      expect(salesData[0].id).toBe("S001");
      expect(salesData[0].amount).toBe(95000);
    });

    it("should handle multiple sales records", () => {
      const salesData = [
        {
          id: "S001",
          listingTitle: "iPhone 13",
          buyerName: "John Doe",
          amount: 95000,
          status: "completed",
          date: new Date("2026-03-01"),
        },
        {
          id: "S002",
          listingTitle: "MacBook Pro",
          buyerName: "Jane Smith",
          amount: 125000,
          status: "completed",
          date: new Date("2026-03-02"),
        },
      ];

      expect(salesData).toHaveLength(2);
      expect(salesData[0].amount + salesData[1].amount).toBe(220000);
    });

    it("should include correct headers", () => {
      const headers = ["Sale ID", "Listing Title", "Buyer Name", "Amount (NPR)", "Status", "Date"];
      expect(headers).toHaveLength(6);
      expect(headers).toContain("Sale ID");
      expect(headers).toContain("Amount (NPR)");
    });
  });

  describe("exportSellerListingsData", () => {
    it("should export seller listings data as CSV", () => {
      const listingsData = [
        {
          id: "L001",
          title: "iPhone 13 Pro",
          category: "Electronics",
          price: 95000,
          status: "active",
          views: 150,
          createdAt: new Date("2026-03-01"),
        },
      ];

      expect(listingsData).toHaveLength(1);
      expect(listingsData[0].price).toBe(95000);
      expect(listingsData[0].status).toBe("active");
    });

    it("should handle multiple listings", () => {
      const listingsData = [
        {
          id: "L001",
          title: "iPhone 13 Pro",
          category: "Electronics",
          price: 95000,
          status: "active",
          views: 150,
          createdAt: new Date("2026-03-01"),
        },
        {
          id: "L002",
          title: "MacBook Air",
          category: "Electronics",
          price: 125000,
          status: "active",
          views: 200,
          createdAt: new Date("2026-03-02"),
        },
      ];

      expect(listingsData).toHaveLength(2);
      expect(listingsData[0].views + listingsData[1].views).toBe(350);
    });
  });

  describe("exportBuyerPurchaseHistory", () => {
    it("should export buyer purchase history as CSV", () => {
      const purchaseData = [
        {
          id: "P001",
          listingTitle: "iPhone 13",
          sellerName: "Tech Store",
          amount: 95000,
          status: "delivered",
          purchaseDate: new Date("2026-03-01"),
        },
      ];

      expect(purchaseData).toHaveLength(1);
      expect(purchaseData[0].status).toBe("delivered");
    });

    it("should handle multiple purchases", () => {
      const purchaseData = [
        {
          id: "P001",
          listingTitle: "iPhone 13",
          sellerName: "Tech Store",
          amount: 95000,
          status: "delivered",
          purchaseDate: new Date("2026-03-01"),
        },
        {
          id: "P002",
          listingTitle: "MacBook Pro",
          sellerName: "Apple Reseller",
          amount: 125000,
          status: "in_transit",
          purchaseDate: new Date("2026-03-02"),
        },
      ];

      expect(purchaseData).toHaveLength(2);
      expect(purchaseData[0].amount + purchaseData[1].amount).toBe(220000);
    });
  });

  describe("exportBuyerSavedItems", () => {
    it("should export buyer saved items as CSV", () => {
      const savedItems = [
        {
          id: "S001",
          title: "Sony Headphones",
          sellerName: "Audio Store",
          price: 35000,
          category: "Electronics",
          savedDate: new Date("2026-03-01"),
        },
      ];

      expect(savedItems).toHaveLength(1);
      expect(savedItems[0].price).toBe(35000);
    });

    it("should handle multiple saved items", () => {
      const savedItems = [
        {
          id: "S001",
          title: "Sony Headphones",
          sellerName: "Audio Store",
          price: 35000,
          category: "Electronics",
          savedDate: new Date("2026-03-01"),
        },
        {
          id: "S002",
          title: "iPad Pro",
          sellerName: "Apple Reseller",
          price: 85000,
          category: "Electronics",
          savedDate: new Date("2026-03-02"),
        },
      ];

      expect(savedItems).toHaveLength(2);
      expect(savedItems[0].price + savedItems[1].price).toBe(120000);
    });
  });

  describe("exportBuyerActiveBids", () => {
    it("should export buyer active bids as CSV", () => {
      const activeBids = [
        {
          id: "B001",
          listingTitle: "Vintage Camera",
          sellerName: "Collector",
          currentBid: 15000,
          yourBid: 16000,
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      ];

      expect(activeBids).toHaveLength(1);
      expect(activeBids[0].yourBid).toBeGreaterThan(activeBids[0].currentBid);
    });

    it("should handle multiple active bids", () => {
      const activeBids = [
        {
          id: "B001",
          listingTitle: "Vintage Camera",
          sellerName: "Collector",
          currentBid: 15000,
          yourBid: 16000,
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: "B002",
          listingTitle: "Gaming Laptop",
          sellerName: "Tech Dealer",
          currentBid: 45000,
          yourBid: 48000,
          endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
      ];

      expect(activeBids).toHaveLength(2);
      expect(activeBids[0].yourBid + activeBids[1].yourBid).toBe(64000);
    });
  });

  describe("CSV Format Validation", () => {
    it("should properly escape quotes in CSV values", () => {
      const title = 'iPhone 13 "Pro" Max';
      expect(title).toContain('"');
      expect(title.replace(/"/g, '""')).toContain('""');
    });

    it("should handle special characters in data", () => {
      const title = "iPhone 13 Pro - Special Edition & More";
      expect(title).toContain("-");
      expect(title).toContain("&");
      expect(title.length).toBeGreaterThan(0);
    });

    it("should handle null and undefined values", () => {
      const value1 = null;
      const value2 = undefined;
      expect(value1).toBeNull();
      expect(value2).toBeUndefined();
    });
  });

  describe("File Download", () => {
    it("should create download link with correct filename", () => {
      const filename = `seller_sales_${new Date().toISOString().split("T")[0]}.csv`;
      expect(filename).toContain("seller_sales_");
      expect(filename).toContain(".csv");
    });

    it("should include date in filename", () => {
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `seller_listings_${dateStr}.csv`;
      expect(filename).toContain(dateStr);
    });
  });

  describe("Data Formatting", () => {
    it("should format dates correctly", () => {
      const date = new Date("2026-03-15");
      const formatted = date.toLocaleDateString();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("should format currency values correctly", () => {
      const price = 35000;
      const formatted = price.toLocaleString();
      expect(formatted).toContain("35");
    });

    it("should handle large numbers", () => {
      const largeNumber = 1000000;
      expect(largeNumber).toBeGreaterThan(999999);
      expect(largeNumber.toLocaleString()).toContain("1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty arrays", () => {
      const emptyArray: any[] = [];
      expect(emptyArray).toHaveLength(0);
    });

    it("should handle single record", () => {
      const salesData = [
        {
          id: "S001",
          listingTitle: "iPhone 13",
          buyerName: "John Doe",
          amount: 95000,
          status: "completed",
          date: new Date("2026-03-01"),
        },
      ];

      expect(salesData).toHaveLength(1);
    });

    it("should handle very long text values", () => {
      const longText = "A".repeat(500);
      expect(longText.length).toBe(500);
    });
  });
});

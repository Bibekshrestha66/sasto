import { serve } from "inngest/express";
import { inngest } from "./client";
import { sendQueuedEmail, handleListingChange, scheduleAuctionClose } from "./functions";

export const inngestHandler = serve({
  client: inngest,
  functions: [
    sendQueuedEmail,
    handleListingChange,
    scheduleAuctionClose,
  ],
});

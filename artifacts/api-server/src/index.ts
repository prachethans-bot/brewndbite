import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import app from "./app";
import { logger } from "./lib/logger";

/**
 * Initialise Stripe schema and start background sync.
 * Non-throwing — the server still starts if Stripe isn't wired up yet.
 */
async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn("No DATABASE_URL — skipping Stripe initialisation");
    return;
  }
  try {
    logger.info("Initialising Stripe schema…");
    await runMigrations({ databaseUrl });

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
    );

    // Run backfill in background — don't block server startup
    stripeSync
      .syncBackfill()
      .then(() => logger.info("Stripe data sync complete"))
      .catch((err) => logger.error({ err }, "Stripe backfill failed"));

    logger.info("Stripe initialised");
  } catch (err) {
    logger.warn(
      { err },
      "Stripe initialisation failed — payment routes will return 503 until Stripe is connected",
    );
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Bind to the port immediately so health checks pass from the first request.
// Stripe init runs in the background — the server is ready before it finishes.
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

initStripe();

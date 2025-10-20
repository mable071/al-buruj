import "dotenv/config";
import { sequelize } from "../models/index.js";

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected. Syncing models (alter: true, force: false)...");
    await sequelize.sync({ alter: true, force: false });
    console.log("Sync complete without data loss.");
    process.exit(0);
  } catch (e) {
    console.error("Sync failed:", e);
    process.exit(1);
  }
}

main();

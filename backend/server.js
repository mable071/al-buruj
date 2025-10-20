import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { router as authRouter } from "./src/routes/auth.js";
import { router as productsRouter } from "./src/routes/products.js";
import { router as productInRouter } from "./src/routes/productIn.js";
import { router as productOutRouter } from "./src/routes/productOut.js";
import { router as reportsRouter } from "./src/routes/reports.js";
import { sequelize } from "./src/models/index.js";

const app = express();
// Prevent 304 Not Modified by disabling ETag and forcing no-store
app.set("etag", false);
app.disable("x-powered-by");
app.use(cors({
  origin: process.env.CORS_ORIGIN,

}));
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Ensure responses are not cached by the browser
app.use((_, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  next();
});

app.get("/", (_, res) => res.json({ ok: true, service: "Al-Buruj Stock API" }));

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/in", productInRouter);
app.use("/api/out", productOutRouter);
app.use("/api/reports", reportsRouter);




const port = process.env.PORT || 10000;
const host = process.env.HOST || "127.0.0.1";

async function start() {
  try {
    await sequelize.authenticate();
   
    console.log("Sequelize connected to MySQL successfully");
  } catch (e) {
    console.error("Sequelize connection error:", e.message);
  }
  finally{
     app.listen(port, () => console.log(`API running on http://${host}:${port}`));
  }
}

start();



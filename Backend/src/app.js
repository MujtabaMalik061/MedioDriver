import { PORT } from "./config/env.js";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import authRoute from "./routes/auth.routes.js";
import mediaRoute from "./routes/media.routes.js";
import keyRoute from "./routes/apiKey.routes.js";
import paymentRoute from "./routes/payment.routes.js";
import dashboardRoute from "./routes/dashboard.routes.js";
import adminRoute from "./routes/admin.routes.js";
import connectToDB from "./database/mongodb.js";

const app = express();
connectToDB();

app.use(cors());
app.use(morgan("dev"));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/media", mediaRoute);
app.use("/api/v1/key", keyRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/admin", adminRoute);

app.get("/", (req, res) => {
  res.send("Welcome to the Server API");
});

app.listen(PORT, async () => {
  await connectToDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;

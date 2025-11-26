import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import router from "./routes/index.js";

const app = express(); 
app.use(cors());
app.use(express.json());

// Root test endpoint
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// App routes
app.use("/api", router);

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// (Uploads disabled) — remove unnecessary static folders
// If someday needed, you can enable it again

// Start server normally (for any platform including Fly.io)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

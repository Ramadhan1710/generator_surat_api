import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import router from "./routes/index.js";

const app = express(); 
app.use(cors());
app.use(express.json());

// Ping endpoint for health check and keep-alive
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", router);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve local uploads (development)
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 
// Serve tmp uploads on Vercel (serverless runtime uses /tmp)
if (process.env.VERCEL) {
	app.use("/uploads", express.static("/tmp/uploads"));
}

// Only start server locally; on Vercel we export the app
const PORT = process.env.PORT || 3000; 
if (!process.env.VERCEL) {
	app.listen(PORT, () =>
		console.log(`Server running on http://localhost:${PORT}`)
	);
}

export default app;
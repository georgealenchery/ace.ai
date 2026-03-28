import express from "express";
import cors from "cors";
import interviewRoutes from "./routes/interview";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Hello, AI Interviewer!");
});

app.use("/api", interviewRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

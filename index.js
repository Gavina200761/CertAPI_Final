require("dotenv").config();

const express = require("express");
const { sequelize } = require("./database/models");

const userRoutes = require("./routes/users");
const certificationRoutes = require("./routes/certifications");
const resourceRoutes = require("./routes/resources");
const projectLogRoutes = require("./routes/projectLogs");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Cert API is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/project-logs", projectLogRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to database:", error.message);
    process.exit(1);
  }
}

startServer();

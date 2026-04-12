require("dotenv").config();

const express = require("express");
const { sequelize } = require("./database/models");
const jsonParser = require("./middleware/jsonParser");
const requestLogger = require("./middleware/requestLogger");
const requireJsonContentType = require("./middleware/requireJsonContentType");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const userRoutes = require("./routes/users");
const certificationRoutes = require("./routes/certifications");
const resourceRoutes = require("./routes/resources");
const projectLogRoutes = require("./routes/projectLogs");

const app = express();
const port = process.env.PORT || 3000;

app.use(requestLogger);
app.use(requireJsonContentType);
app.use(jsonParser);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Cert API is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/certifications", certificationRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/project-logs", projectLogRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate();
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Database connection error: unable to start API.");
    console.error(`Details: ${error.message}`);
    process.exit(1);
  }
}

startServer();

module.exports = app;

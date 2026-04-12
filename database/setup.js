require("dotenv").config();

const { sequelize } = require("./models");

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database setup complete.");
    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  }
}

setupDatabase();

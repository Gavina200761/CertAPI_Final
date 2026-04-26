const path = require("path");
const { Sequelize } = require("sequelize");

let sequelize;

// Use PostgreSQL if DATABASE_URL is provided (Render/production)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === "production" ? { require: true, rejectUnauthorized: false } : false,
    },
  });
} else {
  // Fall back to SQLite for local development
  const storagePath = process.env.DB_STORAGE || path.join(__dirname, "certapi.sqlite");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: storagePath,
    logging: false,
  });
}

module.exports = sequelize;

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Certification = sequelize.define(
    "Certification",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 150],
        },
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 120],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      difficultyLevel: {
        type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
        allowNull: false,
        defaultValue: "beginner",
      },
      status: {
        type: DataTypes.ENUM("planned", "in_progress", "completed", "paused"),
        allowNull: false,
        defaultValue: "planned",
      },
    },
    {
      tableName: "certifications",
      timestamps: true,
      underscored: true,
    }
  );

  return Certification;
};

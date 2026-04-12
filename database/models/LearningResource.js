const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const LearningResource = sequelize.define(
    "LearningResource",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      certificationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "certifications",
          key: "id",
        },
      },
      type: {
        type: DataTypes.ENUM("course", "video", "lab", "practice_exam", "book", "article"),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 180],
        },
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          isUrl: true,
        },
      },
      estimatedTimeMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "learning_resources",
      timestamps: true,
      underscored: true,
    }
  );

  return LearningResource;
};

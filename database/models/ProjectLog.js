const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProjectLog = sequelize.define(
    "ProjectLog",
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
      certificationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "certifications",
          key: "id",
        },
      },
      metric: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 120],
        },
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 120],
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
    },
    {
      tableName: "project_logs",
      timestamps: true,
      underscored: true,
    }
  );

  return ProjectLog;
};

const sequelize = require("../sequelize");

const UserModel = require("./User");
const CertificationModel = require("./Certification");
const LearningResourceModel = require("./LearningResource");
const ProjectLogModel = require("./ProjectLog");

const User = UserModel(sequelize);
const Certification = CertificationModel(sequelize);
const LearningResource = LearningResourceModel(sequelize);
const ProjectLog = ProjectLogModel(sequelize);

User.hasMany(Certification, {
  foreignKey: "userId",
  as: "certifications",
  onDelete: "CASCADE",
});
Certification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Certification.hasMany(LearningResource, {
  foreignKey: "certificationId",
  as: "resources",
  onDelete: "CASCADE",
});
LearningResource.belongsTo(Certification, {
  foreignKey: "certificationId",
  as: "certification",
});

User.hasMany(ProjectLog, {
  foreignKey: "userId",
  as: "projectLogs",
  onDelete: "CASCADE",
});
ProjectLog.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Certification.hasMany(ProjectLog, {
  foreignKey: "certificationId",
  as: "projectLogs",
  onDelete: "CASCADE",
});
ProjectLog.belongsTo(Certification, {
  foreignKey: "certificationId",
  as: "certification",
});

module.exports = {
  sequelize,
  User,
  Certification,
  LearningResource,
  ProjectLog,
};

require("dotenv").config();

const {
  sequelize,
  User,
  Certification,
  LearningResource,
  ProjectLog,
} = require("./models");

async function seedDatabase() {
  try {
    await sequelize.authenticate();

    // Recreate schema for repeatable development seeding.
    await sequelize.sync({ force: true });

    const users = await User.bulkCreate([
      {
        name: "Alicia Brown",
        email: "alicia.brown@example.com",
        passwordHash: "$2b$10$7mA5y4x8vx3QhY1hN2eveu4oTjX3V9G7x5yVh8n9nLqvJfQ6Y8xQK",
        role: "student",
        primaryGoal: "Pass AWS Solutions Architect Associate by fall",
      },
      {
        name: "Marcus Patel",
        email: "marcus.patel@example.com",
        passwordHash: "$2b$10$wE7Y2kJ9f6mLq8bN0rVtUe4qW1zX3cA9sD5fG2hJ7kL8nP0rT1yUQ",
        role: "student",
        primaryGoal: "Move into cybersecurity analyst role",
      },
      {
        name: "Nina Lopez",
        email: "nina.lopez@example.com",
        passwordHash: "$2b$10$Qm5L8nR1tY4uI7oP2aS3dF6gH9jK0lZ2xC5vB8nM1qW4eR7tY0uI",
        role: "instructor",
        primaryGoal: "Coach students through cloud certification tracks",
      },
      {
        name: "Jordan Reed",
        email: "jordan.reed@example.com",
        passwordHash: "$2b$10$Vf2N5mK8pQ1wE4rT7yU0iO3pA6sD9fG2hJ5kL8zX1cV4bN7mQ0rT",
        role: "admin",
        primaryGoal: "Maintain platform quality and data governance",
      },
    ]);

    const [alicia, marcus] = users;

    const certifications = await Certification.bulkCreate([
      {
        userId: alicia.id,
        title: "AWS Certified Solutions Architect - Associate",
        provider: "Amazon Web Services",
        description: "Core cloud architecture, cost optimization, and reliability.",
        difficultyLevel: "intermediate",
        status: "in_progress",
      },
      {
        userId: alicia.id,
        title: "CompTIA Security+",
        provider: "CompTIA",
        description: "Security operations, risk management, and incident response fundamentals.",
        difficultyLevel: "beginner",
        status: "planned",
      },
      {
        userId: marcus.id,
        title: "Microsoft Azure Administrator (AZ-104)",
        provider: "Microsoft",
        description: "Manage Azure identities, governance, networking, and storage.",
        difficultyLevel: "intermediate",
        status: "in_progress",
      },
      {
        userId: marcus.id,
        title: "Cisco CCNA",
        provider: "Cisco",
        description: "Network fundamentals, IP connectivity, and automation basics.",
        difficultyLevel: "advanced",
        status: "paused",
      },
    ]);

    const [awsSaa, securityPlus, az104, ccna] = certifications;

    await LearningResource.bulkCreate([
      {
        certificationId: awsSaa.id,
        type: "course",
        title: "AWS SAA-C03 Full Bootcamp",
        url: "https://learn.example.com/aws-saa-bootcamp",
        estimatedTimeMinutes: 1200,
        isCompleted: false,
      },
      {
        certificationId: awsSaa.id,
        type: "practice_exam",
        title: "SAA-C03 Practice Exam Set A",
        url: "https://practice.example.com/aws-saa-set-a",
        estimatedTimeMinutes: 180,
        isCompleted: true,
      },
      {
        certificationId: securityPlus.id,
        type: "book",
        title: "CompTIA Security+ Study Guide",
        url: "https://books.example.com/security-plus-guide",
        estimatedTimeMinutes: 900,
        isCompleted: false,
      },
      {
        certificationId: az104.id,
        type: "lab",
        title: "Azure Admin Hands-On Labs",
        url: "https://labs.example.com/az104-admin",
        estimatedTimeMinutes: 480,
        isCompleted: false,
      },
      {
        certificationId: az104.id,
        type: "video",
        title: "AZ-104 Crash Review Playlist",
        url: "https://video.example.com/az104-review",
        estimatedTimeMinutes: 240,
        isCompleted: true,
      },
      {
        certificationId: ccna.id,
        type: "article",
        title: "Subnetting Strategies for CCNA",
        url: "https://blog.example.com/ccna-subnetting",
        estimatedTimeMinutes: 45,
        isCompleted: false,
      },
    ]);

    await ProjectLog.bulkCreate([
      {
        userId: alicia.id,
        certificationId: awsSaa.id,
        metric: "practice_score",
        value: "78",
        date: "2026-03-02",
      },
      {
        userId: alicia.id,
        certificationId: awsSaa.id,
        metric: "study_minutes",
        value: "320",
        date: "2026-03-08",
      },
      {
        userId: alicia.id,
        certificationId: securityPlus.id,
        metric: "chapters_completed",
        value: "2",
        date: "2026-03-21",
      },
      {
        userId: marcus.id,
        certificationId: az104.id,
        metric: "lab_sessions",
        value: "6",
        date: "2026-03-10",
      },
      {
        userId: marcus.id,
        certificationId: az104.id,
        metric: "practice_score",
        value: "84",
        date: "2026-03-19",
      },
      {
        userId: marcus.id,
        certificationId: ccna.id,
        metric: "topic_progress",
        value: "routing-fundamentals",
        date: "2026-03-25",
      },
    ]);

    console.log("Database seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();

import { pgTable, text, timestamp, decimal, integer, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Tenant-specific schema
 * These tables exist in each tenant's database
 */

// Students table
export const student = pgTable(
    "student",
    {
        id: text("id").primaryKey(),
        studentId: text("student_id").unique().notNull(),
        name: text("name").notNull(),
        email: text("email"),
        department: text("department"),
        semester: integer("semester"),
        cgpa: decimal("cgpa", { precision: 3, scale: 2 }),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("idx_student_student_id").on(table.studentId),
        index("idx_student_department").on(table.department),
    ],
);

// Grade predictions table
export const gradePrediction = pgTable(
    "grade_prediction",
    {
        id: text("id").primaryKey(),
        studentId: text("student_id")
            .notNull()
            .references(() => student.id, { onDelete: "cascade" }),
        courseCode: text("course_code").notNull(),
        predictedGrade: text("predicted_grade"),
        confidence: decimal("confidence", { precision: 5, scale: 2 }),
        factors: jsonb("factors"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("idx_grade_prediction_student").on(table.studentId)],
);

// Career recommendations table
export const careerRecommendation = pgTable(
    "career_recommendation",
    {
        id: text("id").primaryKey(),
        studentId: text("student_id")
            .notNull()
            .references(() => student.id, { onDelete: "cascade" }),
        careerPath: text("career_path").notNull(),
        matchScore: decimal("match_score", { precision: 5, scale: 2 }),
        skillsGap: jsonb("skills_gap"),
        recommendations: jsonb("recommendations"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("idx_career_recommendation_student").on(table.studentId)],
);

// Chat history table
export const chatHistory = pgTable(
    "chat_history",
    {
        id: text("id").primaryKey(),
        studentId: text("student_id").references(() => student.id, {
            onDelete: "set null",
        }),
        userId: text("user_id"),
        messages: jsonb("messages").notNull().default([]),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("idx_chat_history_student").on(table.studentId)],
);

// Relations
export const studentRelations = relations(student, ({ many }) => ({
    gradePredictions: many(gradePrediction),
    careerRecommendations: many(careerRecommendation),
    chatHistories: many(chatHistory),
}));

export const gradePredictionRelations = relations(gradePrediction, ({ one }) => ({
    student: one(student, {
        fields: [gradePrediction.studentId],
        references: [student.id],
    }),
}));

export const careerRecommendationRelations = relations(careerRecommendation, ({ one }) => ({
    student: one(student, {
        fields: [careerRecommendation.studentId],
        references: [student.id],
    }),
}));

export const chatHistoryRelations = relations(chatHistory, ({ one }) => ({
    student: one(student, {
        fields: [chatHistory.studentId],
        references: [student.id],
    }),
}));

// Types
export type Student = typeof student.$inferSelect;
export type GradePrediction = typeof gradePrediction.$inferSelect;
export type CareerRecommendation = typeof careerRecommendation.$inferSelect;
export type ChatHistory = typeof chatHistory.$inferSelect;

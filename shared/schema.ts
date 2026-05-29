import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 내 식물 컬렉션
export const plants = sqliteTable("plants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),           // 식물 이름 (한국명)
  scientificName: text("scientific_name"), // 학명
  emoji: text("emoji").notNull().default("🌿"),
  difficulty: text("difficulty").notNull().default("보통"), // 초보/보통/고급
  toxic: integer("toxic").notNull().default(0), // 독성 여부
  description: text("description"),
  careInfo: text("care_info"),            // JSON: 물, 햇빛, 온도 등
  imageBase64: text("image_base64"),      // 업로드된 사진 (썸네일)
  wateringIntervalDays: integer("watering_interval_days").default(7),
  lastWateredAt: integer("last_watered_at"), // timestamp
  addedAt: integer("added_at").notNull(),
});

export const insertPlantSchema = createInsertSchema(plants).omit({ id: true });
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plants.$inferSelect;

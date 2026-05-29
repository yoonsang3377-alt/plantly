import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { plants, type Plant, type InsertPlant } from "@shared/schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
const db = drizzle(sqlite);

// Create table if not exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    scientific_name TEXT,
    emoji TEXT NOT NULL DEFAULT '🌿',
    difficulty TEXT NOT NULL DEFAULT '보통',
    toxic INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    care_info TEXT,
    image_base64 TEXT,
    watering_interval_days INTEGER DEFAULT 7,
    last_watered_at INTEGER,
    added_at INTEGER NOT NULL
  )
`);

export interface IStorage {
  createPlant(data: InsertPlant): Promise<Plant>;
  getPlants(): Promise<Plant[]>;
  waterPlant(id: number): Promise<Plant>;
  deletePlant(id: number): Promise<void>;
}

class SqliteStorage implements IStorage {
  async createPlant(data: InsertPlant): Promise<Plant> {
    return db.insert(plants).values(data).returning().get() as Plant;
  }

  async getPlants(): Promise<Plant[]> {
    return db.select().from(plants).orderBy(plants.addedAt).all().reverse();
  }

  async waterPlant(id: number): Promise<Plant> {
    return db.update(plants)
      .set({ lastWateredAt: Date.now() })
      .where(eq(plants.id, id))
      .returning()
      .get() as Plant;
  }

  async deletePlant(id: number): Promise<void> {
    db.delete(plants).where(eq(plants.id, id)).run();
  }
}

export const storage = new SqliteStorage();

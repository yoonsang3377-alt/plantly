import type { Express } from "express";
import type { Server } from "http";
import Anthropic from "@anthropic-ai/sdk";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { insertPlantSchema } from "@shared/schema";

// Anthropic 클라이언트 (API 키는 환경변수에서 자동으로 읽힘)
const client = new Anthropic();

// 이미지 분석 Rate Limiter: 1분에 최대 10회
const analyzeLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
  standardHeaders: true,
  legacyHeaders: false,
});

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMediaType = typeof ALLOWED_MEDIA_TYPES[number];

export function registerRoutes(httpServer: Server, app: Express) {

  // ── AI 식물 분석 ─────────────────────────────────────────────
  app.post("/api/analyze", analyzeLimiter, async (req, res) => {
    try {
      const { imageBase64, mediaType } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "이미지가 없습니다." });

      // mediaType 허용 목록 검증
      const safeMediaType: AllowedMediaType = ALLOWED_MEDIA_TYPES.includes(mediaType)
        ? mediaType
        : "image/jpeg";

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: safeMediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `이 사진에서 식물을 판별해주세요. 반드시 아래 JSON 형식으로만 응답하세요. 식물이 아닌 사진이라면 name을 "식물을 찾을 수 없어요"로 설정하세요.

{
  "name": "식물 한국명",
  "scientificName": "학명 (라틴어)",
  "emoji": "식물과 어울리는 이모지 1개",
  "difficulty": "초보" | "보통" | "고급",
  "toxic": true | false,
  "description": "이 식물에 대한 설명 2-3문장. 특징, 원산지, 용도 등.",
  "careInfo": {
    "water": "물 주기 방법 (예: 일주일에 1-2회, 흙이 마르면)",
    "sunlight": "햇빛 조건 (예: 밝은 간접광, 직사광선 주의)",
    "temperature": "적정 온도 (예: 18-25°C)",
    "humidity": "습도 조건 (예: 40-60%, 건조한 환경 주의)",
    "wateringIntervalDays": 7
  },
  "funFact": "이 식물에 대한 흥미로운 사실 1가지",
  "coupangKeyword": "쿠팡에서 검색할 키워드 (예: 몬스테라 화분)"
}`,
            },
          ],
        }],
      });

      const content = message.content[0];
      if (content.type !== "text") throw new Error("Unexpected response");

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON 파싱 실패");
      const parsed = JSON.parse(jsonMatch[0]);

      res.json(parsed);
    } catch (err) {
      console.error("Analyze error:", err);
      res.status(500).json({ error: "식물 분석 중 오류가 발생했습니다. 다시 시도해주세요." });
    }
  });

  // ── 식물 저장 ─────────────────────────────────────────────────
  app.post("/api/plants", async (req, res) => {
    try {
      const parsed = insertPlantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "유효하지 않은 식물 데이터입니다.", details: parsed.error.flatten() });
      }
      const plant = await storage.createPlant(parsed.data);
      res.json(plant);
    } catch (err) {
      console.error("Save plant error:", err);
      res.status(500).json({ error: "저장 중 오류가 발생했습니다." });
    }
  });

  // ── 식물 목록 조회 ────────────────────────────────────────────
  app.get("/api/plants", async (_req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (err) {
      res.status(500).json({ error: "조회 중 오류가 발생했습니다." });
    }
  });

  // ── 물 주기 기록 ──────────────────────────────────────────────
  app.patch("/api/plants/:id/water", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plant = await storage.waterPlant(id);
      res.json(plant);
    } catch (err) {
      res.status(500).json({ error: "물 주기 기록 중 오류가 발생했습니다." });
    }
  });

  // ── 식물 삭제 ─────────────────────────────────────────────────
  app.delete("/api/plants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlant(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "삭제 중 오류가 발생했습니다." });
    }
  });
}

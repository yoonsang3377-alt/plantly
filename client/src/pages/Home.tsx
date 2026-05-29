import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Leaf, AlertTriangle, Star, BookOpen, RefreshCw, CheckCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface PlantResult {
  name: string;
  scientificName: string;
  emoji: string;
  difficulty: string;
  toxic: boolean;
  description: string;
  careInfo: {
    water: string;
    sunlight: string;
    temperature: string;
    humidity: string;
    wateringIntervalDays: number;
  };
  funFact: string;
  coupangKeyword: string;
}

const difficultyClass: Record<string, string> = {
  "초보": "badge-easy",
  "보통": "badge-medium",
  "고급": "badge-hard",
};

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<PlantResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "이미지 파일만 업로드 가능합니다.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setResult(null);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const analyze = async () => {
    if (!imageFile || !imagePreview) return;
    setLoading(true);
    setResult(null);
    try {
      const base64 = imagePreview.split(",")[1];
      const res = await apiRequest("POST", "/api/analyze", {
        imageBase64: base64,
        mediaType: imageFile.type,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      toast({ title: err.message || "분석 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveToCollection = async () => {
    if (!result || !imagePreview) return;
    setSaving(true);
    try {
      // 썸네일 리사이즈 (작게)
      const canvas = document.createElement("canvas");
      canvas.width = 300; canvas.height = 300;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.src = imagePreview;
      await new Promise(r => { img.onload = r; });
      const size = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 300, 300);
      const thumb = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];

      await apiRequest("POST", "/api/plants", {
        name: result.name,
        scientificName: result.scientificName,
        emoji: result.emoji,
        difficulty: result.difficulty,
        toxic: result.toxic ? 1 : 0,
        description: result.description,
        careInfo: JSON.stringify(result.careInfo),
        imageBase64: thumb,
        wateringIntervalDays: result.careInfo.wateringIntervalDays,
        addedAt: Date.now(),
      });
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({ title: `${result.emoji} ${result.name}이(가) 컬렉션에 추가됐습니다!` });
    } catch {
      toast({ title: "저장 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setSaved(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Hero */}
      {!imagePreview && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5">
            <Leaf size={13} />AI 식물 판별기
          </div>
          <h1 className="font-display font-black gradient-text mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            사진 찍으면 식물 이름을
          </h1>
          <h1 className="font-display font-black text-foreground mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            바로 알려드립니다
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "clamp(1rem, 2vw, 1.125rem)" }}>
            꽃, 나무, 화초 어떤 식물이든 OK. 물 주기, 독성 여부까지 한번에.
          </p>
        </div>
      )}

      {/* Ad slot — 상단 (반응형 디스플레이) */}
      <div className="mb-5 overflow-hidden rounded-xl min-h-0">
        <ins className="adsbygoogle"
          style={{ display: "block", minHeight: 0 }}
          data-ad-client="ca-pub-2882806236519558"
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      {/* Upload zone */}
      {!imagePreview ? (
        <div>
          <div
            className={`upload-zone flex flex-col items-center justify-center py-16 px-6 text-center mb-4 ${dragOver ? "drag-over" : ""}`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-zone"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Upload size={28} className="text-primary" />
            </div>
            <p className="font-semibold text-foreground mb-1">사진을 드래그하거나 클릭하세요</p>
            <p className="text-sm text-muted-foreground">JPG, PNG, WEBP 지원</p>
          </div>

          {/* Camera button */}
          <Button
            onClick={() => cameraInputRef.current?.click()}
            variant="outline"
            className="w-full h-12 gap-2 font-semibold border-primary/30 text-primary hover:bg-primary/5"
            data-testid="button-camera"
          >
            <Camera size={18} />카메라로 바로 찍기
          </Button>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {/* How it works */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "📸", title: "사진 업로드", desc: "식물 사진을 찍거나 올리세요" },
              { icon: "🤖", title: "AI 분석", desc: "10초 안에 식물 정보 제공" },
              { icon: "💾", title: "저장 관리", desc: "컬렉션에 저장 후 관리" },
            ].map((step) => (
              <div key={step.title} className="bg-card border border-border rounded-xl p-3">
                <div className="text-2xl mb-2">{step.icon}</div>
                <p className="font-semibold text-foreground text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview + analyze */}
          <div className="relative rounded-2xl overflow-hidden bg-card border border-border">
            <img src={imagePreview} alt="업로드된 식물" className="w-full max-h-72 object-cover" />
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="scan-pulse text-5xl">🔍</div>
                <p className="font-semibold text-foreground">식물 분석 중...</p>
                <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
              </div>
            )}
          </div>

          {!result && !loading && (
            <div className="flex gap-3">
              <Button onClick={analyze} className="flex-1 h-11 font-semibold bg-primary hover:bg-primary/90 text-white" data-testid="button-analyze">
                <Leaf size={16} className="mr-2" />이 식물 판별하기
              </Button>
              <Button onClick={reset} variant="outline" className="h-11 px-4" data-testid="button-reset">
                다시 선택
              </Button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              <div className="shimmer h-8 w-1/2" />
              <div className="shimmer h-4 w-3/4" />
              <div className="shimmer h-4 w-full" />
              <div className="shimmer h-4 w-5/6" />
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl">{result.emoji}</span>
                      <h2 className="font-display font-black text-foreground" style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)" }}>
                        {result.name}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground italic">{result.scientificName}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${difficultyClass[result.difficulty] || "badge-medium"}`}>
                      {result.difficulty}
                    </span>
                    {result.toxic && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle size={11} />독성 주의
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{result.description}</p>
              </div>

              {/* Care info */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />관리 방법
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "💧", label: "물 주기", value: result.careInfo.water },
                    { icon: "☀️", label: "햇빛", value: result.careInfo.sunlight },
                    { icon: "🌡️", label: "적정 온도", value: result.careInfo.temperature },
                    { icon: "💨", label: "습도", value: result.careInfo.humidity },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted rounded-xl p-3">
                      <div className="text-lg mb-1">{item.icon}</div>
                      <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fun fact */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1"><Star size={11} />알고 계셨나요?</p>
                <p className="text-sm text-foreground">{result.funFact}</p>
              </div>

              {/* Save + Reset buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={saveToCollection}
                  disabled={saving || saved}
                  className="flex-1 h-11 font-semibold bg-primary hover:bg-primary/90 text-white"
                  data-testid="button-save"
                >
                  {saved
                    ? <><CheckCircle size={15} className="mr-2" />컬렉션에 저장됨</>
                    : saving
                      ? <><RefreshCw size={15} className="animate-spin mr-2" />저장 중...</>
                      : "💾 내 컬렉션에 저장"
                  }
                </Button>
                <Button onClick={reset} variant="outline" className="h-11 px-4" data-testid="button-new">
                  새로 찍기
                </Button>
              </div>

              {/* Ad slot — 결과 후 */}
              <div className="overflow-hidden rounded-xl">
                <ins className="adsbygoogle"
                  style={{ display: "block" }}
                  data-ad-client="ca-pub-2882806236519558"
                  data-ad-slot="auto"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
              </div>

              {/* Affiliate */}
              <div className="border border-border rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  🛒 {result.name} 관련 상품
                </p>
                <a
                  href={`https://link.coupang.com/a/AF9884339?url=${encodeURIComponent('https://www.coupang.com/np/search?q=' + encodeURIComponent(result.coupangKeyword))}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors group"
                  data-testid="affiliate-coupang"
                >
                  <span className="text-sm font-medium text-foreground">{result.name} 화분 / 씨앗 구매</span>
                  <span className="text-primary text-xs font-bold group-hover:underline flex items-center gap-1">
                    <ShoppingCart size={12} />쿠팡에서 보기 →
                  </span>
                </a>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  이 링크는 쿠팡 파트너스 제휴 링크입니다
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

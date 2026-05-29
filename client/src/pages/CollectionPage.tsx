import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Droplets, Trash2, Leaf, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Plant } from "@shared/schema";

function getDaysUntilWater(plant: Plant): number {
  if (!plant.lastWateredAt) return 0;
  const daysSince = Math.floor((Date.now() - plant.lastWateredAt) / (1000 * 60 * 60 * 24));
  return Math.max(0, (plant.wateringIntervalDays ?? 7) - daysSince);
}

function getWaterPercent(plant: Plant): number {
  if (!plant.lastWateredAt) return 0;
  const daysSince = Math.floor((Date.now() - plant.lastWateredAt) / (1000 * 60 * 60 * 24));
  const interval = plant.wateringIntervalDays ?? 7;
  return Math.max(0, Math.min(100, ((interval - daysSince) / interval) * 100));
}

function PlantCard({ plant, onWater, onDelete }: {
  plant: Plant;
  onWater: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const daysLeft = getDaysUntilWater(plant);
  const waterPct = getWaterPercent(plant);
  const needsWater = daysLeft === 0;
  const careInfo = plant.careInfo ? JSON.parse(plant.careInfo) : null;

  return (
    <div className="plant-card bg-card border border-border rounded-2xl overflow-hidden" data-testid={`plant-card-${plant.id}`}>
      {/* Image */}
      <div className="relative h-40 bg-muted flex items-center justify-center">
        {plant.imageBase64 ? (
          <img
            src={`data:image/jpeg;base64,${plant.imageBase64}`}
            alt={plant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{plant.emoji}</span>
        )}
        {plant.toxic === 1 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle size={10} />독성
          </div>
        )}
        {needsWater && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            💧 물 필요
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-display font-bold text-foreground text-base leading-tight">{plant.name}</h3>
            {plant.scientificName && (
              <p className="text-xs text-muted-foreground italic">{plant.scientificName}</p>
            )}
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-muted text-muted-foreground shrink-0">
            {plant.difficulty}
          </span>
        </div>

        {/* Water status */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Droplets size={11} />물 주기</span>
            <span>{needsWater ? "지금 물 주세요!" : `${daysLeft}일 후`}</span>
          </div>
          <div className="water-bar">
            <div className="water-fill" style={{ width: `${waterPct}%` }} />
          </div>
        </div>

        {careInfo?.water && (
          <p className="text-xs text-muted-foreground mb-3 bg-muted rounded-lg px-3 py-2">
            💧 {careInfo.water}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onWater(plant.id)}
            size="sm"
            className="flex-1 h-8 text-xs gap-1 bg-blue-500 hover:bg-blue-600 text-white border-0"
            data-testid={`button-water-${plant.id}`}
          >
            <Droplets size={12} />물 줬어요
          </Button>
          <Button
            onClick={() => onDelete(plant.id)}
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-muted-foreground hover:text-destructive hover:border-destructive"
            data-testid={`button-delete-${plant.id}`}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const waterMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/plants/${id}/water`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({ title: "💧 물 주기 완료! 기록됐습니다." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/plants/${id}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({ title: "식물이 컬렉션에서 삭제됐습니다." });
    },
  });

  const needsWaterCount = plants.filter(p => getDaysUntilWater(p) === 0).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-foreground" style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
            내 식물 컬렉션
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            총 {plants.length}개 식물
            {needsWaterCount > 0 && (
              <span className="ml-2 text-blue-500 font-semibold">
                💧 {needsWaterCount}개 물 필요
              </span>
            )}
          </p>
        </div>
        <Link href="/">
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white" data-testid="button-add-plant">
            <Plus size={14} />식물 추가
          </Button>
        </Link>
      </div>

      {/* Ad slot — 콜렉션 상단 */}
      <div className="mb-5 overflow-hidden rounded-xl">
        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-2882806236519558"
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="shimmer h-64 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && plants.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="font-display font-bold text-foreground text-xl mb-2">아직 식물이 없어요</h2>
          <p className="text-muted-foreground text-sm mb-6">사진을 찍어서 첫 번째 식물을 추가해보세요!</p>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Leaf size={15} />식물 판별하러 가기
            </Button>
          </Link>
        </div>
      )}

      {/* Grid */}
      {!isLoading && plants.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {plants.map(plant => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onWater={(id) => waterMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Affiliate */}
      {plants.length > 0 && (
        <div className="mt-8 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">🛒 화초 관리 추천 상품</p>
          {[
            { label: "실내 식물 영양제", keyword: "식물 영양제" },
            { label: "화분 + 흙 세트", keyword: "화분 흙 세트" },
            { label: "자동 물주기 기기", keyword: "자동 물주기" },
          ].map(item => (
            <a key={item.label}
              href={`https://www.coupang.com/np/search?q=${encodeURIComponent(item.keyword)}`}
              target="_blank" rel="noopener noreferrer sponsored"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-sm group mb-1"
            >
              <span className="text-foreground font-medium">{item.label}</span>
              <span className="text-primary text-xs font-bold group-hover:underline">쿠팡에서 보기 →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

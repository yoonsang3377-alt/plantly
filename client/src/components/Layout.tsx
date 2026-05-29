import { Link, useLocation } from "wouter";
import { Sun, Moon, Leaf, Library, Menu, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useState, useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  // AdSense 초기화 (페이지 변경 시마다 광고 다시 로드)
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense 스크립트가 로드되지 않았을 때 에러 무시
    }
  }, []);

  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Plantly">
              <circle cx="14" cy="14" r="13" fill="hsl(142,65%,35%)" opacity="0.15"/>
              <path d="M14 22 C14 22 7 17 7 11 C7 7.7 10.1 5 14 5 C17.9 5 21 7.7 21 11 C21 17 14 22 14 22Z" fill="hsl(142,65%,35%)"/>
              <path d="M14 22 L14 12" stroke="hsl(142,65%,55%)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 16 C14 16 11 14 10 12" stroke="hsl(142,65%,60%)" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M14 14 C14 14 17 13 18 11" stroke="hsl(142,65%,60%)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="font-display font-black text-lg tracking-tight text-foreground">Plantly</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {[
              { href: "/", label: "식물 판별", icon: Leaf },
              { href: "/collection", label: "내 식물", icon: Library },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${location === href ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon size={14} />{label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" aria-label="테마 전환">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="sm:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
            {[{ href: "/", label: "식물 판별" }, { href: "/collection", label: "내 식물 컬렉션" }].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6 mt-8">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Leaf size={13} className="text-primary" />
            <span>Plantly — AI 식물 판별기, 무료로 사용하세요</span>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">식물 판별</Link>
            <Link href="/collection" className="hover:text-foreground transition-colors">내 식물</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

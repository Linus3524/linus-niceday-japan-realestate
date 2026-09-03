import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import type { RelatedThread } from "../lib/threadSearch";
import { trackAction, type ThreadRecommendationSource } from "../lib/trackView";
import { threadImageIndex } from "../data/threadImageIndex";

interface RelatedThreadsProps {
  threads: RelatedThread[];
  source: ThreadRecommendationSource;
  query?: string;
  total?: number;
  compact?: boolean;
}

export function RelatedThreads({ threads, source, query, total, compact = false }: RelatedThreadsProps) {
  const impressionSignature = useRef("");

  useEffect(() => {
    if (threads.length === 0) return;
    const signature = threads.map(thread => thread.id).join(",");
    const timer = window.setTimeout(() => {
      if (impressionSignature.current === signature) return;
      impressionSignature.current = signature;
      trackAction(`threads-${source}-view`);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [threads, source]);

  if (threads.length === 0) return null;

  const allThreadsHref = query
    ? `#threads?search=${encodeURIComponent(query.trim())}`
    : "#threads";

  return (
    <section className={`${compact ? "mt-4" : "border-t border-dashed border-[#C9D8D1] pt-6"}`} aria-label="Linus 的相關 Threads 實務分享">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="font-serif text-base font-bold text-[#1A2A22]">Linus 的相關實務分享</h4>
          <p className="mt-1 font-sans text-[11px] leading-relaxed text-zinc-500">第一線租屋、買房經驗，補充指南之外的實際情況。</p>
        </div>
        {query && (total ?? 0) > threads.length && (
          <a href={allThreadsHref} className="font-sans text-xs font-bold text-[#007d5a] hover:text-[#00a174]">
            查看全部 {total} 篇 →
          </a>
        )}
      </div>

      <div className={`grid gap-3 ${threads.length > 1 ? "md:grid-cols-2" : ""}`}>
        {threads.map(thread => {
          const imageUrl = thread.imageUrl ?? threadImageIndex[thread.id];
          return (
          <a
            key={thread.id}
            href={thread.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAction(`threads-${source}-click`)}
            className="group flex min-w-0 flex-col border border-[#DDE3DF] bg-[#FFFDF9] p-4 text-left transition-all hover:border-[#00a174] hover:shadow-colored-soft"
          >
            {imageUrl && (
              <div className="-mx-4 -mt-4 mb-4 overflow-hidden border-b border-[#DDE3DF] bg-[#EEF3F0]">
                <img
                  src={imageUrl}
                  alt={`${thread.title}的 Threads 貼文圖片`}
                  loading="lazy"
                  decoding="async"
                  onError={event => { event.currentTarget.hidden = true; }}
                  className={`w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02] ${compact ? "h-32 md:h-36" : "h-44 md:h-48"}`}
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-3 font-sans text-[10px] font-bold tracking-wide text-[#007d5a]">
              <span className="truncate">THREADS · {thread.category}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
            <h5 className="mt-2 font-serif text-sm font-bold leading-6 text-[#1A2A22]">{thread.title}</h5>
            <p className="mt-2 line-clamp-3 font-sans text-xs leading-6 text-zinc-600">{thread.excerpt}</p>
            <span className="mt-3 font-sans text-[11px] font-bold text-[#007d5a]">閱讀完整分享 ↗</span>
          </a>
          );
        })}
      </div>
    </section>
  );
}

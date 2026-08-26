"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePageTitle } from "@/context/PageTitleContext";
import { useFetch } from "@/lib/useFetch";
import { api, ApiClientError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

// Starter questions, in the mix of English and Hinglish the shop's staff
// actually use — they double as a hint that the assistant understands both.
const SUGGESTIONS = [
  "Aaj ka collection kitna hua?",
  "Is mahine ka total sale?",
  "Best selling products this month",
  "Kaunse products ka stock kam hai?",
  "Pending refunds kitne hain?",
  "WELCOME10 kitni baar use hua?",
];

// Friendly names for the trace chips — the raw tool names are internal.
const TOOL_LABELS = {
  get_sales_summary: "Sales",
  get_top_products: "Top products",
  find_customer: "Customer lookup",
  get_customer_detail: "Customer profile",
  get_customer_timeline: "Customer timeline",
  get_order: "Order",
  list_orders: "Orders",
  get_inventory_status: "Inventory",
  get_coupon_stats: "Coupons",
  get_refund_summary: "Refunds",
};

export default function AskPage() {
  usePageTitle("Ask");

  const fetchStatus = useCallback(() => api.get("/assistant/status").then((r) => r.data), []);
  const { data: status } = useFetch(fetchStatus, [fetchStatus]);

  const [turns, setTurns] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  async function send(question) {
    const q = (question ?? input).trim();
    if (!q || busy) return;

    setError("");
    setInput("");
    // Shown immediately so the question doesn't vanish while the model works.
    const next = [...turns, { role: "user", content: q }];
    setTurns(next);
    setBusy(true);

    try {
      // Prior turns travel with the question so follow-ups like "and last
      // month?" resolve against what was just discussed.
      const res = await api.post("/assistant/ask", {
        messages: next.map((t) => ({ role: t.role, content: t.content })),
      });
      setTurns((cur) => [...cur, { role: "assistant", content: res.data.answer, trace: res.data.trace }]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
      // The question stays on screen so it can be retried without retyping.
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  if (status && !status.configured) {
    return (
      <Card title="Ask">
        <EmptyState
          title="The assistant isn't switched on"
          description="Set GEMINI_API_KEY in the backend's .env and restart it. You can get a key from Google AI Studio."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-body text-lg font-semibold text-ink">Ask about your store</h2>
            <p className="mt-1 max-w-2xl font-body text-sm text-ink/55">
              Questions about sales, orders, customers, stock, coupons and refunds — in English or Hinglish. Every
              answer is read live from your own data.
            </p>
          </div>
          <Badge tone="neutral">read-only</Badge>
        </div>
      </Card>

      <Card padded={false} className="flex min-h-[26rem] flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {turns.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
              <p className="font-body text-sm text-ink/50">Try one of these:</p>
              <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-line-paper px-3.5 py-2 font-body text-xs text-ink/70 transition-colors hover:border-stitch hover:text-stitch"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {turns.map((turn, i) => (
                <li key={i} className={turn.role === "user" ? "flex justify-end" : ""}>
                  {turn.role === "user" ? (
                    <p className="max-w-[75%] rounded-2xl rounded-br-sm bg-stitch px-4 py-2.5 font-body text-sm text-paper">
                      {turn.content}
                    </p>
                  ) : (
                    <div className="max-w-[85%]">
                      <AssistantMessage text={turn.content} />
                      {turn.trace?.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-wide text-ink/35">read from</span>
                          {turn.trace.map((t, j) => (
                            <span
                              key={j}
                              title={JSON.stringify(t.args)}
                              className="rounded-full bg-line-paper/50 px-2 py-0.5 font-mono text-[10px] text-ink/50"
                            >
                              {TOOL_LABELS[t.tool] || t.tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {busy && (
                <li>
                  <p className="font-body text-sm text-ink/45">
                    <span className="inline-block animate-pulse">Looking it up…</span>
                  </p>
                </li>
              )}
            </ul>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="border-t border-line-paper px-5 py-3 font-body text-sm text-danger">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-3 border-t border-line-paper p-4"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Aaj ka collection kitna hua?"
            maxLength={2000}
            className="flex-1 rounded-full border border-line-paper bg-surface px-4 py-2.5 font-body text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch"
          />
          {turns.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { setTurns([]); setError(""); }}>
              Clear
            </Button>
          )}
          <Button type="submit" loading={busy} disabled={!input.trim()}>
            Ask
          </Button>
        </form>
      </Card>
    </div>
  );
}

/**
 * Renders the assistant's reply.
 *
 * The model writes light Markdown — **bold** for figures, `-`/`1.` lists, and
 * `---` rules. Rather than pull in a Markdown library for that much, this
 * handles exactly those three and treats everything else as plain text, which
 * also means nothing the model emits can inject markup.
 */
function AssistantMessage({ text }) {
  const lines = String(text).split("\n");

  return (
    <div className="flex flex-col gap-1.5 font-body text-sm leading-relaxed text-ink">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <span key={i} className="h-1" />;
        if (/^-{3,}$/.test(trimmed)) return <hr key={i} className="my-1 border-line-paper" />;

        const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
        const numbered = /^(\d+)\.\s+(.*)$/.exec(trimmed);
        if (bullet) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-ink/35">•</span>
              <span>{renderBold(bullet[1])}</span>
            </p>
          );
        }
        if (numbered) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="text-ink/45">{numbered[1]}.</span>
              <span>{renderBold(numbered[2])}</span>
            </p>
          );
        }
        const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
        if (heading) {
          return (
            <p key={i} className="mt-1 font-semibold text-ink">
              {renderBold(heading[1])}
            </p>
          );
        }
        return <p key={i}>{renderBold(trimmed)}</p>;
      })}
    </div>
  );
}

// **bold** and `code` — split on both so figures and order numbers stand out.
function renderBold(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="rounded bg-line-paper/50 px-1 py-0.5 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
}

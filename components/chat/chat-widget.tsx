"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: string;
  link?: { href: string; label: string };
};

type QuickReply = { label: string; reply: string; link?: { href: string; label: string } };

const SESSION_KEY = "levenon_chat_history";
const BOT_REPLY_DELAY_MS = 500;

const WELCOME_MESSAGES: Array<Omit<ChatMessage, "id" | "timestamp">> = [
  { role: "bot", text: "Hi! 👋 Welcome to Levenon. How can we help you?" },
  { role: "bot", text: "You can ask about: orders, fabrics, sizing, delivery" },
];

/**
 * "Size guide" links to the real `/size-guide` page, not the PDP's own
 * `SizeGuide` modal (client brief, 2026-09-02 asked for "opens size guide"
 * too) — that component manages its own `open` state internally with no
 * external control, and giving it one just for this one quick-reply chip
 * would mean restructuring a shared component used elsewhere in the
 * catalogue for a widget that has a working link-based fallback already.
 * Disclosed rather than silently dropped.
 */
const QUICK_REPLIES: QuickReply[] = [
  {
    label: "Track my order",
    reply: "Visit our Track Order page →",
    link: { href: "/track", label: "Track Order" },
  },
  {
    label: "Size guide",
    reply: "Check our size guide →",
    link: { href: "/size-guide", label: "Size Guide" },
  },
  {
    label: "Delivery info",
    reply: "Free delivery above PKR 5,000. 3-5 working days.",
  },
  {
    label: "Contact us",
    reply: "Email us at hello@levenon.pk or visit our FAQs.",
    link: { href: "/faqs", label: "FAQs" },
  },
];

const AUTO_REPLY =
  "Thanks for your message! Our team will get back to you within 24 hours. For quick answers, visit our FAQs page.";

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Client-only support widget (client brief, 2026-09-02) — canned replies,
 * no external service. Bottom-**left**, explicitly, so it never overlaps a
 * WhatsApp float — though there isn't one built in this codebase today
 * (checked: no floating WhatsApp button component exists anywhere;
 * checkout's own WhatsApp link lives inside the cart drawer). The corner
 * choice still stands regardless, since the brief's own reasoning (avoid a
 * bottom-right collision) is sound even before one exists.
 *
 * History lives in `sessionStorage` — "persists within session, clears on
 * close" in the brief describes `sessionStorage`'s own built-in behaviour
 * (cleared when the tab/browser session ends), not extra logic to wipe it
 * every time the *panel* closes; re-opening the panel within the same tab
 * session keeps the conversation, which is what every real chat widget
 * this pattern is modelled on actually does.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  // A bot reply is scheduled with `setTimeout` after the message that
  // triggered it; by the time it fires the reader may have closed the
  // panel, and a plain closed-over `open` would still read whatever it was
  // *when the timeout was scheduled*, not the truth at the moment it
  // actually fires. The unread dot needs the truth.
  const openRef = useRef(open);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as ChatMessage[];
        setMessages(stored);
        seededRef.current = stored.length > 0;
      }
    } catch {
      // Corrupt value under this key — start fresh rather than throwing.
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [messages, reducedMotion]);

  const appendBotMessage = (text: string, link?: { href: string; label: string }) => {
    setMessages((current) => [...current, { id: newId(), role: "bot", text, timestamp: "Just now", link }]);
    if (!openRef.current) setHasUnread(true);
  };

  const appendUserMessage = (text: string) => {
    setMessages((current) => [...current, { id: newId(), role: "user", text, timestamp: "Just now" }]);
  };

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setHasUnread(false);
    if (!seededRef.current) {
      seededRef.current = true;
      setMessages((current) => [
        ...current,
        ...WELCOME_MESSAGES.map((message) => ({ ...message, id: newId(), timestamp: "Just now" })),
      ]);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    appendUserMessage(reply.label);
    window.setTimeout(() => appendBotMessage(reply.reply, reply.link), BOT_REPLY_DELAY_MS);
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    appendUserMessage(text);
    setDraft("");
    window.setTimeout(() => appendBotMessage(AUTO_REPLY), BOT_REPLY_DELAY_MS);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <m.button
        type="button"
        onClick={handleToggle}
        aria-label={open ? "Close chat" : "Chat with Levenon"}
        aria-haspopup="dialog"
        aria-expanded={open}
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-paper shadow-[0_4px_20px_rgba(124,42,232,0.4)] transition-colors duration-200 ease-state hover:bg-purple-700"
      >
        {!open && (
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 animate-ping rounded-full bg-purple-500/60 motion-reduce:animate-none"
          />
        )}
        {open ? (
          <X aria-hidden="true" size={22} strokeWidth={1.5} />
        ) : (
          <MessageCircle aria-hidden="true" size={22} strokeWidth={1.5} />
        )}
        {hasUnread && !open && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 h-3 w-3 rounded-full bg-error ring-2 ring-paper"
          />
        )}
      </m.button>

      <AnimatePresence>
        {open && (
          <m.div
            role="dialog"
            aria-label="Chat with Levenon"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
            transition={{ duration: reducedMotion ? 0.15 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 left-6 right-6 z-40 flex h-[380px] flex-col overflow-hidden rounded-t-xl border border-hairline bg-paper shadow-[0_20px_60px_rgba(11,11,13,0.25)] sm:right-auto sm:h-[440px] sm:w-[320px]"
          >
            <div className="flex shrink-0 items-center justify-between bg-ink px-4 py-3">
              <p className="font-display text-[14px] font-semibold text-paper">Chat with Levenon</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center text-paper/70 transition-colors duration-200 ease-state hover:text-paper"
              >
                <X aria-hidden="true" size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-3 py-2 text-sm leading-relaxed",
                      message.role === "user" ? "bg-ink text-paper" : "bg-hairline/50 text-ink",
                    )}
                  >
                    {message.text}
                    {message.link && (
                      <>
                        {" "}
                        <Link
                          href={message.link.href}
                          className="underline underline-offset-2 hover:text-purple-500"
                        >
                          {message.link.label}
                        </Link>
                      </>
                    )}
                  </div>
                  <span className="mt-1 text-[10px] text-charcoal">{message.timestamp}</span>
                </div>
              ))}
            </div>

            <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-hairline px-4 py-3">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply.label}
                  type="button"
                  onClick={() => handleQuickReply(reply)}
                  className="rounded-full border border-hairline px-2.5 py-1 text-xs text-ink transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
                >
                  {reply.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-hairline p-3">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type a message…"
                aria-label="Type a message"
                className="min-h-[40px] flex-1 rounded-full border border-hairline bg-paper px-4 text-sm text-ink focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-colors duration-200 ease-state hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send aria-hidden="true" size={16} strokeWidth={1.5} />
              </button>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

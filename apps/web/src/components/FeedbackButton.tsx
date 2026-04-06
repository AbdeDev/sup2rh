import { useState } from "react";
import { MessageCircle, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { submitFeedback } from "../lib/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export function FeedbackButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      await submitFeedback({ message: message.trim(), rating: rating ?? undefined });
      setSent(true);
      setMessage("");
      setRating(null);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[136px] right-4 sm:bottom-20 sm:right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-muted-foreground/80 text-background shadow-lg transition-all hover:scale-110 hover:shadow-xl hover:bg-muted-foreground"
        title={t("feedback.title")}
        aria-label={t("feedback.title")}
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl animate-in fade-in scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">{t("feedback.title")}</h3>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sent ? (
              <p className="py-4 text-sm text-success text-center">{t("feedback.thankYou")}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t("feedback.ratingLabel")}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        className="p-1 rounded hover:scale-110 transition-transform"
                        aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            rating !== null && i <= rating
                              ? "fill-orange text-orange"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder={t("feedback.placeholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  disabled={loading}
                  className="resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" size="sm" disabled={loading || !message.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.send")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

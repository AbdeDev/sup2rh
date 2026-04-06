import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
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
      }, 1800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bouton flottant avis — empilé au-dessus du support */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[132px] right-4 sm:bottom-[76px] sm:right-5 z-40 h-11 w-11 rounded-2xl bg-card border border-border text-foreground shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl hover:border-primary/40 hover:text-primary group"
        title={t("feedback.title")}
        aria-label={t("feedback.title")}
      >
        <Star className="h-5 w-5 fill-current text-orange group-hover:text-primary transition-colors" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            {/* Header coloré */}
            <div className="bg-gradient-to-r from-[#f37021]/10 via-card to-orange/5 border-b border-border px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#f37021]/15 border border-[#f37021]/25 flex items-center justify-center">
                  <Star className="h-4 w-4 fill-[#f37021] text-[#f37021]" />
                </div>
                <h3 className="text-sm font-heading font-bold text-foreground">
                  {t("feedback.title")}
                </h3>
              </div>
              <button
                onClick={() => !loading && setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {sent ? (
                <div className="py-6 text-center flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                    <Star className="h-7 w-7 fill-success text-success" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{t("feedback.thankYou")}</p>
                  <p className="text-xs text-muted-foreground">
                    Ton retour aide à améliorer l'expérience
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {t("feedback.ratingLabel")}
                    </p>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i)}
                          className="p-1 rounded-lg hover:scale-110 transition-transform"
                          aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`h-7 w-7 transition-all ${
                              rating !== null && i <= rating
                                ? "fill-[#f37021] text-[#f37021] scale-110"
                                : "text-muted-foreground/40 hover:text-[#f37021]/60"
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
                    rows={3}
                    disabled={loading}
                    className="resize-none rounded-xl text-sm bg-muted/30 border-border focus:bg-background transition-colors"
                  />
                  <div className="flex gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-10 text-sm rounded-xl"
                      onClick={() => setOpen(false)}
                      disabled={loading}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-10 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={loading || !message.trim()}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.send")}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

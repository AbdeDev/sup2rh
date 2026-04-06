import { useState, useEffect } from "react";
import { HelpCircle, Lightbulb, Star, X, Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { submitSupportTicket, submitFeedback } from "../lib/api";
import { supabase } from "../lib/supabase";

type TabType = "support" | "feature_request" | "feedback";

export function SupportButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [type, setType] = useState<TabType>("support");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  function openDialog(tab: TabType) {
    setType(tab);
    setOpen(true);
    setFabExpanded(false);
    setSent(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type === "feedback") {
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
        toast.error(err instanceof Error ? err.message : t("support.errorGeneric"));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast.error(t("support.allFieldsRequired"));
      return;
    }
    setLoading(true);
    try {
      await submitSupportTicket({
        email: email.trim(),
        type: type === "support" ? "support" : "feature_request",
        subject: subject.trim(),
        message: message.trim(),
      });
      toast.success(type === "support" ? t("support.successHelp") : t("support.successSuggestion"));
      setOpen(false);
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("support.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const isFeedback = type === "feedback";
  const isSupport = type === "support";

  return (
    <>
      {/* FAB — single button on mobile, expands to show options */}
      {!open && (
        <div className="fixed bottom-20 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col-reverse items-end gap-2">
          {/* Main FAB */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setFabExpanded((p) => !p);
              } else {
                openDialog("support");
              }
            }}
            className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:bg-primary/90 group"
            title={t("support.buttonTitle")}
            aria-label={t("support.buttonTitle")}
          >
            {fabExpanded ? (
              <X className="h-5 w-5 transition-transform" />
            ) : (
              <MessageCircle className="h-5 w-5 transition-transform group-hover:rotate-12" />
            )}
          </button>

          {/* Expanded FAB menu */}
          {fabExpanded && (
            <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <button
                onClick={() => openDialog("support")}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border shadow-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-primary" />
                {t("support.helpTab")}
              </button>
              <button
                onClick={() => openDialog("feature_request")}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border shadow-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Lightbulb className="h-4 w-4 text-orange" />
                {t("support.suggestionTab")}
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => openDialog("feedback")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border shadow-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Star className="h-4 w-4 text-orange fill-orange" />
                  {t("feedback.title")}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close FAB menu */}
      {fabExpanded && !open && (
        <div className="fixed inset-0 z-40" onClick={() => setFabExpanded(false)} />
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            {/* Header */}
            <div
              className={`border-b border-border px-5 py-4 flex items-center justify-between transition-colors ${
                isFeedback
                  ? "bg-gradient-to-r from-[#f37021]/8 via-card to-orange/5"
                  : isSupport
                    ? "bg-gradient-to-r from-primary/8 via-card to-primary/5"
                    : "bg-gradient-to-r from-[#f37021]/8 via-card to-[#f37021]/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
                    isFeedback
                      ? "bg-[#f37021]/15 border border-[#f37021]/25"
                      : isSupport
                        ? "bg-primary/15 border border-primary/25"
                        : "bg-[#f37021]/15 border border-[#f37021]/25"
                  }`}
                >
                  {isFeedback ? (
                    <Star className="h-4 w-4 fill-[#f37021] text-[#f37021]" />
                  ) : isSupport ? (
                    <HelpCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-[#f37021]" />
                  )}
                </div>
                <h3 className="text-sm font-heading font-bold text-foreground">
                  {isFeedback
                    ? t("feedback.title")
                    : isSupport
                      ? t("support.helpTab")
                      : t("support.suggestionTab")}
                </h3>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  setSent(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs — only for support/suggestion */}
            {!isFeedback && (
              <div className="flex border-b border-border bg-muted/20">
                <button
                  onClick={() => setType("support")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-200 ${
                    isSupport
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {t("support.helpTab")}
                </button>
                <button
                  onClick={() => setType("feature_request")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-200 ${
                    type === "feature_request"
                      ? "text-[#f37021] border-b-2 border-[#f37021] bg-[#f37021]/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {t("support.suggestionTab")}
                </button>
              </div>
            )}

            {/* Feedback content */}
            {isFeedback ? (
              <div className="p-5">
                {sent ? (
                  <div className="py-6 text-center flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
                      <Star className="h-7 w-7 fill-success text-success" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("feedback.thankYou")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("feedback.thankYouSub")}</p>
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
                    <textarea
                      placeholder={t("feedback.placeholder")}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      disabled={loading}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-colors resize-none"
                    />
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        className="flex-1 h-10 text-sm rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors font-medium"
                        onClick={() => {
                          setOpen(false);
                          setSent(false);
                        }}
                        disabled={loading}
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-10 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
                        disabled={loading || !message.trim()}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.send")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Support / Suggestion form */
              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <input
                  type="email"
                  placeholder={t("support.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-sm rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-colors"
                />
                <input
                  type="text"
                  placeholder={t("support.subjectPlaceholder")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-sm rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-colors"
                />
                <textarea
                  placeholder={
                    isSupport
                      ? t("support.helpMessagePlaceholder")
                      : t("support.suggestionMessagePlaceholder")
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-11 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm ${
                    isSupport
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-[#f37021] hover:bg-[#f37021]/90"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      {t("common.send")}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

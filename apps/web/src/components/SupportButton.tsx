import { useState } from "react";
import { HelpCircle, Lightbulb, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { submitSupportTicket } from "../lib/api";

export function SupportButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"support" | "feature_request">("support");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast.error(t("support.allFieldsRequired"));
      return;
    }
    setLoading(true);
    try {
      await submitSupportTicket({
        email: email.trim(),
        type,
        subject: subject.trim(),
        message: message.trim(),
      });
      toast.success(type === "support" ? t("support.successHelp") : t("support.successSuggestion"));
      setOpen(false);
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  const isSupport = type === "support";

  return (
    <>
      {/* Bouton flottant support */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-16 right-4 sm:bottom-5 sm:right-5 z-50 h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:bg-primary/90 group"
        title={t("support.buttonTitle")}
        aria-label={t("support.buttonTitle")}
      >
        <HelpCircle className="h-5 w-5 transition-transform group-hover:rotate-12" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            {/* Header */}
            <div
              className={`border-b border-border px-5 py-4 flex items-center justify-between transition-colors ${isSupport ? "bg-gradient-to-r from-primary/8 via-card to-primary/5" : "bg-gradient-to-r from-[#f37021]/8 via-card to-[#f37021]/5"}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${isSupport ? "bg-primary/15 border border-primary/25" : "bg-[#f37021]/15 border border-[#f37021]/25"}`}
                >
                  {isSupport ? (
                    <HelpCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-[#f37021]" />
                  )}
                </div>
                <h3 className="text-sm font-heading font-bold text-foreground">
                  {isSupport ? t("support.buttonTitle") : t("support.suggestionTab")}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
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
                  !isSupport
                    ? "text-[#f37021] border-b-2 border-[#f37021] bg-[#f37021]/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {t("support.suggestionTab")}
              </button>
            </div>

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
          </div>
        </div>
      )}
    </>
  );
}

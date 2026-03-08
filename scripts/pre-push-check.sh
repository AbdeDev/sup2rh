#!/usr/bin/env bash
# =============================================================================
# pre-push-check.sh
# Exécute les vérifications CI localement avant d'autoriser un git push.
# Bloquez le push si l'une des vérifications échoue.
#
# Installation du hook git :
#   bash scripts/setup-hooks.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
BOLD='\033[1m'

step() { echo -e "\n${BLUE}${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
fail() { echo -e "${RED}✗ $*${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }

echo -e "\n${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   SUP des RH — Vérifications CI      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"

# ── Vérifier que bun est disponible ──────────────────────────────────────────
step "Vérification des outils"
command -v bun >/dev/null 2>&1 || fail "bun n'est pas installé. Voir https://bun.sh"
ok "bun $(bun --version)"

# ── Vérifier les secrets exposés ─────────────────────────────────────────────
step "Scan des secrets exposés"
SECRETS_FOUND=0

# Vérifie que les .env ne sont pas committés
if git diff --cached --name-only | grep -qE '^apps/[^/]+/\.env$'; then
  fail "🚨 SÉCURITÉ : un fichier .env est staged ! Retirez-le avec : git reset HEAD <fichier>"
fi

# Vérifie les patterns de secrets courants dans le diff staged
RISKY=$(git diff --cached | grep -E '(api_key|apikey|secret|password|private_key)\s*=\s*["\x27][^"\x27 ]{8,}' --ignore-case || true)
if [ -n "$RISKY" ]; then
  warn "Patterns suspects détectés dans le diff staged :"
  echo "$RISKY"
  read -r -p "Continuer quand même ? [y/N] " resp
  [[ "$resp" =~ ^[Yy]$ ]] || fail "Push annulé par l'utilisateur."
fi
ok "Aucun secret évident détecté"

# ── Installer les dépendances si nécessaire ───────────────────────────────────
step "Vérification des dépendances"
if [ ! -d "node_modules" ]; then
  warn "node_modules absent — installation en cours…"
  bun install --frozen-lockfile || fail "bun install a échoué"
fi
ok "Dépendances OK"

# ── Lint ──────────────────────────────────────────────────────────────────────
step "Lint (ESLint)"
bun run lint 2>&1 | tail -5 || fail "Lint échoué — corrige les erreurs avant de pusher"
ok "Lint OK"

# ── Typecheck ─────────────────────────────────────────────────────────────────
step "TypeScript typecheck"
bun run typecheck 2>&1 | tail -10 || fail "TypeScript a trouvé des erreurs — corrige-les avant de pusher"
ok "TypeScript OK"

# ── Build Web ─────────────────────────────────────────────────────────────────
step "Build Web"
bun run build:web 2>&1 | tail -5 || fail "Build web échoué"
ok "Build web OK"

# ── Build Admin ───────────────────────────────────────────────────────────────
step "Build Admin"
bun run build:admin 2>&1 | tail -5 || fail "Build admin échoué"
ok "Build admin OK"

# ── Build Landing ─────────────────────────────────────────────────────────────
step "Build Landing"
bun run build:landing 2>&1 | tail -5 || fail "Build landing échoué"
ok "Build landing OK"

echo -e "\n${GREEN}${BOLD}✅ Toutes les vérifications sont passées — push autorisé !${NC}\n"

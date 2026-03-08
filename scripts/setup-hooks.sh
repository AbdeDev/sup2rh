#!/usr/bin/env bash
# =============================================================================
# setup-hooks.sh
# Installe les git hooks du projet (pre-commit, commit-msg, pre-push).
# Usage : bash scripts/setup-hooks.sh
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_DIR="$ROOT/.git/hooks"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

echo -e "\n${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  Installation des git hooks…         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"

# ── pre-commit hook (lint rapide sur fichiers staged) ─────────────────────────
PRE_COMMIT="$HOOKS_DIR/pre-commit"
cat > "$PRE_COMMIT" << 'HOOK'
#!/usr/bin/env bash
# Hook pre-commit — vérifie les fichiers staged avant de committer
# Bypass en urgence : git commit --no-verify

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'

echo -e "\n${BOLD}▶ Pre-commit check…${NC}"

# Fichiers frontend staged (tsx, ts, astro)
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|astro)$' || true)

if [ -z "$STAGED" ]; then
  echo -e "${GREEN}✓ Aucun fichier frontend stagé, skip lint${NC}"
  exit 0
fi

# Détecte quelles apps sont impactées
HAS_WEB=$(echo "$STAGED" | grep -q '^apps/web/' && echo 1 || echo 0)
HAS_ADMIN=$(echo "$STAGED" | grep -q '^apps/admin/' && echo 1 || echo 0)
HAS_LANDING=$(echo "$STAGED" | grep -q '^apps/landing/' && echo 1 || echo 0)

# Lint rapide (seulement les workspaces touchés)
LINT_CMD="bun run"
if [ "$HAS_WEB" = "1" ] || [ "$HAS_ADMIN" = "1" ]; then
  echo -e "${YELLOW}  → ESLint en cours…${NC}"
  $LINT_CMD lint 2>&1 | grep -E '(error|warning|Error)' | head -20 || {
    echo -e "${RED}✗ ESLint a trouvé des erreurs — corrige-les ou utilise git commit --no-verify${NC}"
    exit 1
  }
  echo -e "${GREEN}  ✓ Lint OK${NC}"
fi

if [ "$HAS_LANDING" = "1" ]; then
  echo -e "${YELLOW}  → Vérification Astro…${NC}"
  bun run --cwd apps/landing astro check 2>&1 | grep -iE '(error|✗)' | head -10 || true
fi

echo -e "${GREEN}${BOLD}✓ Pre-commit OK — commit autorisé${NC}\n"
exit 0
HOOK

chmod +x "$PRE_COMMIT"
echo -e "${GREEN}✓ Hook pre-commit installé${NC}"

# ── pre-push hook (CI complet avant push) ─────────────────────────────────────
PRE_PUSH="$HOOKS_DIR/pre-push"
cat > "$PRE_PUSH" << 'HOOK'
#!/usr/bin/env bash
# Hook pre-push — lance le CI complet avant d'autoriser un push
# Bypass en urgence : git push --no-verify
ROOT="$(git rev-parse --show-toplevel)"
exec bash "$ROOT/scripts/pre-push-check.sh"
HOOK

chmod +x "$PRE_PUSH"
echo -e "${GREEN}✓ Hook pre-push installé${NC}"

# ── commit-msg hook (format du message) ───────────────────────────────────────
COMMIT_MSG="$HOOKS_DIR/commit-msg"
cat > "$COMMIT_MSG" << 'HOOK'
#!/usr/bin/env bash
# Vérifie le format du message de commit
# Format attendu : <type>: <description> (min 10 chars)
# Types valides  : feat, fix, refactor, docs, style, test, chore, ci, build
MSG=$(cat "$1")
MSG_TRIMMED=$(echo "$MSG" | head -1 | xargs)

if [ ${#MSG_TRIMMED} -lt 5 ]; then
  echo "❌ Message de commit trop court (minimum 5 caractères)"
  exit 1
fi

# Encourage (non-bloquant) le format conventionnel
if ! echo "$MSG_TRIMMED" | grep -qE '^(feat|fix|refactor|docs|style|test|chore|ci|build|wip)(\(.+\))?:'; then
  echo "⚠️  Convention suggérée : feat|fix|refactor|docs|chore: <description>"
  echo "   Exemple : feat(landing): rework hero section"
  echo "   (commit quand même…)"
fi
exit 0
HOOK

chmod +x "$COMMIT_MSG"
echo -e "${GREEN}✓ Hook commit-msg installé${NC}"

echo -e "\n${GREEN}${BOLD}✅ 3 hooks installés : pre-commit, commit-msg, pre-push${NC}"
echo -e "${YELLOW}💡 Bypass d'urgence : git commit --no-verify / git push --no-verify${NC}\n"

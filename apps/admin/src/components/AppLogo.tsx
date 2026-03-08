/** Logo Lamascott sans fond – couleurs fixes (non impacté par dark/light mode) */
export function AppLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img
      src="/lamascott-hero.png"
      alt="Quizz Sup des Rh"
      className={`${className} logo-theme-safe`}
      width={40}
      height={40}
    />
  );
}

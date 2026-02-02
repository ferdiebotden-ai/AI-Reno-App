/**
 * Estimate Layout
 * Full-screen chat experience without footer
 * The chat interface takes up the full viewport
 */

export default function EstimateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the footer for this route using CSS */}
      <style>{`
        /* Hide footer on estimate pages - full-screen chat experience */
        footer { display: none !important; }
        /* Remove min-height constraint from main */
        main { min-height: auto !important; }
      `}</style>
      {children}
    </>
  );
}

import './MenuBackdrop.css';

// Decorative cream + soft-blob backdrop shared by the /games, /activities and
// /tools menus. Everything is CSS/SVG so it costs a couple of KB instead of the
// multi-megabyte PNG the rest of the app leans on.
export default function MenuBackdrop() {
  return (
    <div className="bop-backdrop" aria-hidden="true">
      <svg className="bop-blob bop-blob-yellow" viewBox="0 0 425 192" preserveAspectRatio="none" focusable="false">
        <path d="M0 0 H425 C419 8 406 35 390 50 C374 65 352 76 330 88 C308 100 282 109 255 120 C228 131 198 142 170 152 C142 162 113 171 85 178 C57 185 14 190 0 192 Z" />
      </svg>

      <svg className="bop-blob bop-blob-mint" viewBox="0 0 288 500" preserveAspectRatio="none" focusable="false">
        <path d="M288 0 C276 1 246 0 218 5 C190 10 147 16 118 30 C89 44 62 65 43 90 C24 115 10 151 3 180 C-4 209 -6 236 0 265 C6 294 20 328 38 355 C56 382 81 409 108 430 C135 451 168 468 198 480 C228 492 273 497 288 500 Z" />
      </svg>

      <svg className="bop-blob bop-blob-lilac" viewBox="0 0 242 341" preserveAspectRatio="none" focusable="false">
        <path d="M0 0 C12 2 49 0 75 10 C101 20 132 38 155 60 C178 82 201 112 215 140 C229 168 237 202 240 230 C243 258 239 286 235 305 C231 324 218 335 215 341 H0 Z" />
      </svg>

      <svg className="bop-blob bop-blob-lilac-low" viewBox="0 0 230 151" preserveAspectRatio="none" focusable="false">
        <path d="M230 0 C217 2 177 1 150 10 C123 19 92 38 70 55 C48 72 32 99 20 115 C8 131 3 145 0 151 H230 Z" />
      </svg>

      <svg className="bop-mark bop-dots" viewBox="0 0 116 116" focusable="false">
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <circle key={`${row}-${col}`} cx={6 + col * 26} cy={6 + row * 26} r="3.4" fill="currentColor" />
          )),
        )}
      </svg>

      <svg className="bop-mark bop-squiggle bop-squiggle-one" viewBox="0 0 92 34" focusable="false">
        <path d="M4 22c10 0 7-16 17-16s5 22 16 22 11-22 22-22 8 16 17 16 7-9 12-9" />
      </svg>

      <svg className="bop-mark bop-squiggle bop-squiggle-two" viewBox="0 0 92 34" focusable="false">
        <path d="M4 22c10 0 7-16 17-16s5 22 16 22 11-22 22-22 8 16 17 16 7-9 12-9" />
      </svg>

      <svg className="bop-mark bop-squiggle bop-squiggle-three" viewBox="0 0 92 34" focusable="false">
        <path d="M4 22c10 0 7-16 17-16s5 22 16 22 11-22 22-22 8 16 17 16 7-9 12-9" />
      </svg>

      <svg className="bop-mark bop-cloud bop-cloud-one" viewBox="0 0 108 48" focusable="false">
        <path d="M16 40 A14 14 0 0 1 32 18 A18 18 0 0 1 64 16 A13 13 0 0 1 84 26 A9 9 0 0 1 92 40 H16 Z" />
      </svg>

      <svg className="bop-mark bop-cloud bop-cloud-two" viewBox="0 0 108 48" focusable="false">
        <path d="M16 40 A14 14 0 0 1 32 18 A18 18 0 0 1 64 16 A13 13 0 0 1 84 26 A9 9 0 0 1 92 40 H16 Z" />
      </svg>

      <svg className="bop-mark bop-sparkle bop-sparkle-one" viewBox="0 0 24 24" focusable="false">
        <path d="M12 0c1.2 7.6 3.2 10.8 12 12-8.8 1.2-10.8 4.4-12 12-1.2-7.6-3.2-10.8-12-12C8.8 10.8 10.8 7.6 12 0Z" fill="currentColor" />
      </svg>

      <svg className="bop-mark bop-sparkle bop-sparkle-two" viewBox="0 0 24 24" focusable="false">
        <path d="M12 0c1.2 7.6 3.2 10.8 12 12-8.8 1.2-10.8 4.4-12 12-1.2-7.6-3.2-10.8-12-12C8.8 10.8 10.8 7.6 12 0Z" fill="currentColor" />
      </svg>

      <svg className="bop-mark bop-sparkle bop-sparkle-three" viewBox="0 0 24 24" focusable="false">
        <path d="M12 0c1.2 7.6 3.2 10.8 12 12-8.8 1.2-10.8 4.4-12 12-1.2-7.6-3.2-10.8-12-12C8.8 10.8 10.8 7.6 12 0Z" fill="currentColor" />
      </svg>
    </div>
  );
}

import './menuTheme.css';

function Spark({ side }) {
  return (
    <svg className={`bop-menu-title-spark bop-menu-title-spark-${side}`} viewBox="0 0 34 40" aria-hidden="true" focusable="false">
      <path d="M6 7 26 3" />
      <path d="M3 20h24" />
      <path d="M6 33 26 37" />
    </svg>
  );
}

// Splits the translated title so the final word can carry the purple accent,
// e.g. "CHOOSE YOUR *GAME*". Single-word titles stay fully navy.
function splitTitle(title) {
  const words = String(title ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return { lead: words.join(' '), accent: '' };
  return { accent: words[words.length - 1], lead: words.slice(0, -1).join(' ') };
}

export default function MenuHeading({ id, title }) {
  const { lead, accent } = splitTitle(title);

  return (
    <div className="bop-menu-heading">
      <h1 className="bop-menu-title" id={id}>
        <Spark side="left" />
        {lead}
        {accent && <span className="bop-menu-title-accent">{accent}</span>}
        <Spark side="right" />
      </h1>
    </div>
  );
}

import { Children, useEffect, useState } from 'react';

function getResponsiveColumnCount() {
  if (typeof window === 'undefined') return 5;
  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 920) return 2;
  if (window.innerWidth <= 1180) return 3;
  return 5;
}

export default function MasonryDeckGrid({
  as: GridTag = 'div',
  children,
  className = '',
  columnCount,
  style,
}) {
  const [responsiveColumnCount, setResponsiveColumnCount] = useState(getResponsiveColumnCount);

  useEffect(() => {
    if (columnCount) return undefined;
    const handleResize = () => setResponsiveColumnCount(getResponsiveColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columnCount]);

  const resolvedColumnCount = Math.max(1, columnCount || responsiveColumnCount);
  const columns = Array.from({ length: resolvedColumnCount }, () => []);

  Children.toArray(children).forEach((card, index) => {
    columns[index % resolvedColumnCount].push(card);
  });

  return (
    <GridTag
      className={`deck-grid deck-masonry-grid ${className}`.trim()}
      style={{ ...style, '--deck-columns': resolvedColumnCount }}
    >
      {columns.map((cards, columnIndex) => (
        <div className="deck-masonry-column" key={`deck-column-${columnIndex}`}>
          {cards}
        </div>
      ))}
    </GridTag>
  );
}

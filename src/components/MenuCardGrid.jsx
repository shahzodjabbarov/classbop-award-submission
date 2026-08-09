import MenuCard from './MenuCard';
import { MENU_CARD_MAX_WIDTH, menuPageStyles } from './menuCardLayout';

export default function MenuCardGrid({
  ariaLabel,
  columns,
  items,
  itemTranslationRoot,
  onOpen,
  openLabelKey,
  t,
  themed = false,
}) {
  const gridProps = themed
    ? { className: 'bop-menu-grid', style: { gridTemplateColumns: `repeat(${columns}, 1fr)` } }
    : { style: { ...menuPageStyles.grid, gridTemplateColumns: `repeat(${columns}, 1fr)` } };

  return (
    <div {...gridProps} aria-label={ariaLabel}>
      {items.map((item) => {
        const title = t(`${itemTranslationRoot}.${item.id}.title`);

        return (
          <MenuCard
            key={item.id}
            title={title}
            description={t(`${itemTranslationRoot}.${item.id}.desc`)}
            meta={t(`${itemTranslationRoot}.${item.id}.meta`)}
            image={item.image}
            accent={item.accent}
            disabled={item.disabled}
            badge={item.badgeKey ? t(item.badgeKey) : item.badge}
            onClick={item.disabled ? undefined : () => onOpen(item.route)}
            ariaLabel={item.disabled ? title : t(openLabelKey, { title })}
            style={{
              maxWidth: columns === 1 ? MENU_CARD_MAX_WIDTH : 'none',
              margin: columns === 1 ? '0 auto' : '0',
            }}
          />
        );
      })}
    </div>
  );
}

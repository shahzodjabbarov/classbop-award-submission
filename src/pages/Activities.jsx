import { useNavigate } from 'react-router-dom';
import MenuCardGrid from '../components/MenuCardGrid';
import MenuHeading from '../components/MenuHeading';
import { useMenuColumns } from '../components/menuCardLayout';
import { ACTIVITY_MENU_ITEMS } from '../data/menuCards';
import { useI18n } from '../i18n/useI18n';

export default function Activities() {
  const columns = useMenuColumns();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="bop-menu">
      <MenuHeading title={t('activities.title')} subtitle={t('activities.subtitle')} />

      <MenuCardGrid
        themed
        columns={columns}
        items={ACTIVITY_MENU_ITEMS}
        itemTranslationRoot="activities.items"
        onOpen={(route) => navigate(route)}
        openLabelKey="activities.openActivity"
        t={t}
      />
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import MenuCardGrid from '../components/MenuCardGrid';
import MenuHeading from '../components/MenuHeading';
import { useMenuColumns } from '../components/menuCardLayout';
import { GAME_MENU_ITEMS } from '../data/menuCards';
import { useI18n } from '../i18n/useI18n';

export default function Dashboard() {
  const columns = useMenuColumns();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleGameClick = (route) => {
    navigate(route);
  };

  return (
    <div className="bop-menu">
      <MenuHeading title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <MenuCardGrid
        themed
        columns={columns}
        items={GAME_MENU_ITEMS}
        itemTranslationRoot="dashboard.games"
        onOpen={handleGameClick}
        openLabelKey="dashboard.openGame"
        t={t}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';

export const MENU_GRID_GAP = '20px';
export const MENU_CARD_MAX_WIDTH = '420px';

export function getMenuColumnCount() {
  if (window.innerWidth < 600) return 1;
  if (window.innerWidth < 900) return 2;
  return 3;
}

export function useMenuColumns() {
  const [columns, setColumns] = useState(getMenuColumnCount);

  useEffect(() => {
    const handleResize = () => setColumns(getMenuColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columns;
}

export const menuPageStyles = {
  grid: {
    display: 'grid',
    gap: MENU_GRID_GAP,
    width: '100%',
    padding: '0 20px 80px 20px',
    boxSizing: 'border-box',
  },
};

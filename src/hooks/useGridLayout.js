import { useRef, useState, useEffect } from 'react';

export function useGridLayout(rowHeight = 85) {
  const gridRef = useRef(null);
  const [rows, setRows] = useState(3);

  useEffect(() => {
    const measure = () => {
      if (gridRef.current) {
        const h = gridRef.current.clientHeight;
        setRows(Math.max(2, Math.floor(h / rowHeight)));
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [rowHeight]);

  return { gridRef, rows };
}

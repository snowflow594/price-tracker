import { useState } from 'react';
import { getPriceHistory } from '../services/api';
import PriceChart from './PriceChart';

export default function ProductCard({ product }) {
  const [history, setHistory] = useState(null);
  const [open, setOpen] = useState(false);

  const toggle = async () => {
    if (!open && !history) {
      const data = await getPriceHistory(product.id);
      setHistory(data);
    }
    setOpen(v => !v);
  };

  const currency = product.currency || (product.source === 'amazon' ? 'USD' : 'PEN');
  const price = product.price ? `${currency} ${parseFloat(product.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="card">
      <div className="card-header" onClick={toggle}>
        <div className="card-info">
          <span className="source-badge" data-source={product.source}>{product.source}</span>
          <p className="product-name">{product.name}</p>
        </div>
        <div className="card-price">
          <span className="price">{price}</span>
          <span className="toggle-icon">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="card-body">
          {history && history.length > 1 ? (
            <PriceChart history={history} currency={currency} />
          ) : (
            <p className="no-history">
              {history === null ? 'Cargando...' : 'Solo hay un registro de precio. El gráfico aparecerá después de la próxima actualización automática.'}
            </p>
          )}
          <a className="product-link" href={product.url} target="_blank" rel="noreferrer">Ver en {product.source} →</a>
        </div>
      )}
    </div>
  );
}

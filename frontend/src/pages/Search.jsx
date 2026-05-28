import { useState } from 'react';
import { searchML, searchAmazon, addProduct } from '../services/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('mercadolibre');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState({});
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const data = source === 'amazon' ? await searchAmazon(query) : await searchML(query);
      setResults(data);
      if (data.length === 0) setError('Sin resultados. Intenta con otro término.');
    } catch {
      setError('Error al buscar. Intenta de nuevo.');
    }
    setLoading(false);
  };

  const handleSave = async (item) => {
    setSaved(s => ({ ...s, [item.url]: 'saving' }));
    try {
      await addProduct({ name: item.name, url: item.url, source: item.source });
      setSaved(s => ({ ...s, [item.url]: 'saved' }));
    } catch {
      setSaved(s => ({ ...s, [item.url]: 'error' }));
    }
  };

  const btnLabel = (url) => ({ saving: 'Guardando...', saved: '✓ Guardado', error: 'Error' }[saved[url]] || '+ Seguir precio');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Buscar productos</h1>
          <p className="subtitle">Busca en Mercado Libre o Amazon y agrega productos a seguir</p>
        </div>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="source-tabs">
          <button type="button" className={`tab ${source === 'mercadolibre' ? 'active' : ''}`} onClick={() => setSource('mercadolibre')}>
            Mercado Libre
          </button>
          <button type="button" className={`tab ${source === 'amazon' ? 'active' : ''}`} onClick={() => setSource('amazon')}>
            Amazon
          </button>
        </div>
        <div className="search-input-row">
          <input
            type="text"
            placeholder="Ej: laptop, iPhone 15, auriculares..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {error && <p className="error-msg">{error}</p>}

      {results.length > 0 && (
        <div className="results-list">
          {results.map((item, i) => (
            <div className="result-item" key={i}>
              <div className="result-info">
                <p className="result-name">{item.name}</p>
                <p className="result-price">
                  {item.currency} {parseFloat(item.price).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                className={`btn ${saved[item.url] === 'saved' ? 'btn-saved' : 'btn-primary'}`}
                onClick={() => handleSave(item)}
                disabled={!!saved[item.url]}
              >
                {btnLabel(item.url)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

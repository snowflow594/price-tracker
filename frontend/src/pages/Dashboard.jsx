import { useEffect, useState } from 'react';
import { getProducts, triggerUpdate } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    await triggerUpdate();
    setTimeout(() => { setUpdating(false); load(); }, 40000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mis productos</h1>
          <p className="subtitle">{products.length} producto{products.length !== 1 ? 's' : ''} monitoreados</p>
        </div>
        <button className="btn btn-secondary" onClick={handleUpdate} disabled={updating}>
          {updating ? 'Actualizando...' : '↻ Actualizar precios'}
        </button>
      </div>

      {loading ? (
        <p className="empty">Cargando...</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No tienes productos guardados aún.</p>
          <p>Ve a <strong>Buscar</strong> para agregar productos a seguir.</p>
        </div>
      ) : (
        <div className="product-list">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

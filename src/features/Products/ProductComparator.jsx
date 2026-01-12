import { useEffect, useMemo, useState } from 'react';
import { safeStorage } from '../../hooks/useSafeLocalStorage';
import { useLanguage } from '../../context/AppProviders';

const STORAGE_KEYS = {
  FAVORITES: 'favoriteProducts',
};

const defaultProduct = () => ({
  id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  name: '',
  price: '',
  weight: '',
});

const normalizeFavorites = stored =>
  Array.isArray(stored)
    ? stored.map(item => ({
        name: item.name || '',
        price: Number(item.price) || 0,
        weight: Number(item.weight) || 0,
        pricePerUnit:
          Number(item.pricePerUnit) ||
          (item.price && item.weight ? Number(item.price) / Number(item.weight) : 0),
        addedAt: item.addedAt || Date.now(),
      }))
    : [];

const extractData = product => {
  const price = parseFloat(product.price);
  const weight = parseFloat(product.weight);
  return {
    name: product.name || '',
    price,
    weight,
    pricePerUnit: price > 0 && weight > 0 ? price / weight : 0,
  };
};

export function ProductComparator() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([defaultProduct()]);
  const [favorites, setFavorites] = useState(() =>
    normalizeFavorites(safeStorage.getJSON(STORAGE_KEYS.FAVORITES)),
  );
  const [result, setResult] = useState(null);

  useEffect(() => {
    safeStorage.setJSON(STORAGE_KEYS.FAVORITES, favorites);
  }, [favorites]);

  const addProduct = () => setProducts(prev => [...prev, defaultProduct()]);

  const removeProduct = id =>
    setProducts(prev => (prev.length > 1 ? prev.filter(product => product.id !== id) : prev));

  const updateProduct = (id, field, value) =>
    setProducts(prev =>
      prev.map(product => (product.id === id ? { ...product, [field]: value } : product)),
    );

  const toggleFavorite = product => {
    const data = extractData(product);
    if (!(data.price > 0 && data.weight > 0)) {
      alert(t('favorites.fill'));
      return;
    }

    setFavorites(prev => {
      const exists = prev.find(
        favorite =>
          favorite.name === data.name &&
          Number(favorite.price) === Number(data.price) &&
          Number(favorite.weight) === Number(data.weight),
      );
      if (exists) {
        return prev.filter(favorite => favorite !== exists);
      }
      return [
        ...prev,
        {
          ...data,
          addedAt: Date.now(),
        },
      ];
    });
  };

  const isFavorite = product => {
    const data = extractData(product);
    return favorites.some(
      favorite =>
        favorite.name === data.name &&
        Number(favorite.price) === Number(data.price) &&
        Number(favorite.weight) === Number(data.weight),
    );
  };

  const compare = event => {
    event?.preventDefault();
    const validProducts = products
      .map(extractData)
      .filter(product => product.price > 0 && product.weight > 0);

    if (validProducts.length < 2) {
      alert(t('alerts.notEnoughProducts'));
      setResult(null);
      return;
    }

    validProducts.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    const best = validProducts[0];

    const comparisons = validProducts.slice(1).map(product => ({
      ...product,
      diff: ((product.pricePerUnit / best.pricePerUnit - 1) * 100).toFixed(1),
    }));

    setResult({ best, comparisons });
  };

  const favoritesEmpty = favorites.length === 0;

  const favoriteList = useMemo(
    () =>
      favorites.map((favorite, index) => {
        const pricePerUnit =
          favorite.pricePerUnit ||
          (favorite.price && favorite.weight ? favorite.price / favorite.weight : 0);
        return {
          ...favorite,
          pricePerUnit,
          id: `${favorite.name}-${favorite.price}-${favorite.weight}-${index}`,
        };
      }),
    [favorites],
  );

  return (
    <section className="grid two-columns gap-lg">
      <div className="card">
        <header className="section-header">
          <h3>{t('product.title')}</h3>
          <button type="button" className="btn secondary" onClick={addProduct}>
            {t('product.addButton')}
          </button>
        </header>

        <form className="stack gap-md" onSubmit={compare}>
          {products.map(product => (
            <div className="card" key={product.id}>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => removeProduct(product.id)}
                aria-label="Remove product"
              >
                ×
              </button>
              <div className="stack gap-sm">
                <label>
                  {t('product.field.nameLabel')}
                  <input
                    type="text"
                    value={product.name}
                    onChange={e => updateProduct(product.id, 'name', e.target.value)}
                    placeholder={t('product.field.namePlaceholder')}
                  />
                </label>
                <label>
                  {t('product.field.priceLabel')}
                  <input
                    type="number"
                    inputMode="decimal"
                    value={product.price}
                    onChange={e => updateProduct(product.id, 'price', e.target.value)}
                    placeholder="0.00"
                  />
                </label>
                <label>
                  {t('product.field.weightLabel')}
                  <input
                    type="number"
                    inputMode="decimal"
                    value={product.weight}
                    onChange={e => updateProduct(product.id, 'weight', e.target.value)}
                    placeholder="0.00"
                  />
                </label>
                <button
                  type="button"
                  className={`favorite-btn ${isFavorite(product) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(product)}
                >
                  {isFavorite(product) ? '★ ' : '☆ '}
                  {isFavorite(product) ? t('favorites.added') : t('favorites.add')}
                </button>
              </div>
            </div>
          ))}

          <button type="submit" className="btn primary">
            {t('product.compareButton')}
          </button>
        </form>

        {result && (
          <div className="result-container">
            <p>
              {t('product.result.better')}:{' '}
              <strong>
                {result.best.name || t('chart.unnamed')} (
                {result.best.pricePerUnit.toFixed(2)} {t('product.result.perUnit')})
              </strong>
            </p>
            {result.comparisons.map(product => (
              <p key={`${product.name}-${product.diff}`}>
                {product.name}: {t('product.result.moreExpensive')} {product.diff}%
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <header className="section-header">
          <h3>{t('favorites.title')}</h3>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setFavorites([])}
            disabled={favoritesEmpty}
          >
            {t('favorites.clear')}
          </button>
        </header>

        {favoritesEmpty ? (
          <p className="empty-state">{t('favorites.empty')}</p>
        ) : (
          <div className="favorites-list">
            {favoriteList.map(item => (
              <div className="favorite-item" key={item.id}>
                <div>
                  <strong>{item.name || t('chart.unnamed')}</strong>
                  <p className="favorite-meta">
                    {item.price} ₽ · {item.weight} · {item.pricePerUnit.toFixed(2)}{' '}
                    {t('favorites.perUnit')}
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() =>
                    setFavorites(prev =>
                      prev.filter(
                        fav =>
                          !(
                            fav.name === item.name &&
                            Number(fav.price) === Number(item.price) &&
                            Number(fav.weight) === Number(item.weight)
                          ),
                      ),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

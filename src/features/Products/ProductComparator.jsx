import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { safeStorage } from '../../hooks/useSafeLocalStorage';
import { useLanguage } from '../../context/AppProviders';
import { useSheetSync } from '../../hooks/useSheetSync';
import { objectsToRows, rowsToObjects } from '../../services/googleSheets';

const STORAGE_KEYS = {
  FAVORITES: 'favoriteProducts',
};

const FAVORITES_RANGE = 'SavedGoods!A:D';
const FAVORITES_HEADERS = ['ID_saved_product', 'productName', 'productPrice', 'productUnits'];

const defaultProduct = () => ({
  id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  name: '',
  price: '',
  weight: '',
});

const createFavoriteId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const normalizeFavorites = stored =>
  Array.isArray(stored)
    ? stored.map(item => ({
        id: item.id || createFavoriteId(),
        name: item.name || '',
        price: Number(item.price) || 0,
        weight: Number(item.weight) || 0,
        pricePerUnit:
          Number(item.pricePerUnit) ||
          (item.price && item.weight ? Number(item.price) / Number(item.weight) : 0),
        addedAt: item.addedAt || Date.now(),
      }))
    : [];

const favoritesFromSheet = values => {
  const rows = rowsToObjects(values, FAVORITES_HEADERS);
  if (!rows.length) return [];
  return rows.map(row => {
    const price = Number(row.productPrice) || 0;
    const units = Number(row.productUnits) || 0;
    return {
      id: row.ID_saved_product || createFavoriteId(),
      name: row.productName || '',
      price,
      weight: units,
      pricePerUnit: price > 0 && units > 0 ? price / units : 0,
      addedAt: Date.now(),
    };
  });
};

const favoritesToSheet = favorites => [
  FAVORITES_HEADERS,
  ...objectsToRows(
    favorites.map(item => ({
      ID_saved_product: item.id || createFavoriteId(),
      productName: item.name || '',
      productPrice: item.price ?? '',
      productUnits: item.weight ?? '',
    })),
    FAVORITES_HEADERS,
  ),
];

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
  const [pendingFavorites, setPendingFavorites] = useState(null);
  const favoritesSyncTimeoutRef = useRef();
  const [result, setResult] = useState(null);
  const {
    canSync,
    pull: pullFavorites,
    push: pushFavorites,
    isSyncing: isFavoritesSyncing,
    syncError: favoritesSyncError,
    hydratedRef,
  } = useSheetSync({
    range: FAVORITES_RANGE,
    mapFromSheet: favoritesFromSheet,
    mapToSheet: favoritesToSheet,
  });

  const scheduleFavoritesSync = useCallback(
    next => {
      if (!canSync) return;
      setPendingFavorites(next);
    },
    [canSync],
  );

  const updateFavorites = useCallback(
    (updater, { sync = true } = {}) => {
      setFavorites(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        safeStorage.setJSON(STORAGE_KEYS.FAVORITES, next);
        if (sync) {
          scheduleFavoritesSync(next);
        }
        return next;
      });
    },
    [scheduleFavoritesSync],
  );

  useEffect(() => {
    if (!canSync || hydratedRef.current) return;
    let cancelled = false;
    pullFavorites()
      .then(remoteFavorites => {
        if (!remoteFavorites || cancelled) return;
        updateFavorites(normalizeFavorites(remoteFavorites), { sync: false });
      })
      .catch(error => {
        console.warn('Failed to load favorites from Google Sheets', error);
      });

    return () => {
      cancelled = true;
    };
  }, [canSync, pullFavorites, hydratedRef, updateFavorites]);

  useEffect(() => {
    if (!canSync || !pendingFavorites) return undefined;
    if (favoritesSyncTimeoutRef.current) {
      clearTimeout(favoritesSyncTimeoutRef.current);
    }

    favoritesSyncTimeoutRef.current = setTimeout(() => {
      pushFavorites(pendingFavorites)
        .catch(error => console.warn('Failed to sync favorites to Google Sheets', error))
        .finally(() => {
          favoritesSyncTimeoutRef.current = null;
          setPendingFavorites(null);
        });
    }, 1000);

    return () => {
      if (favoritesSyncTimeoutRef.current) {
        clearTimeout(favoritesSyncTimeoutRef.current);
        favoritesSyncTimeoutRef.current = null;
      }
    };
  }, [canSync, pendingFavorites, pushFavorites]);

  useEffect(() => () => {
    if (favoritesSyncTimeoutRef.current) {
      clearTimeout(favoritesSyncTimeoutRef.current);
    }
  }, []);

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

    updateFavorites(prev => {
      const exists = prev.find(
        favorite =>
          favorite.name === data.name &&
          Number(favorite.price) === Number(data.price) &&
          Number(favorite.weight) === Number(data.weight),
      );
      if (exists) {
        return prev.filter(favorite => favorite.id !== exists.id);
      }
      return [
        ...prev,
        {
          ...data,
          id: createFavoriteId(),
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
          id: favorite.id || `${favorite.name}-${favorite.price}-${favorite.weight}-${index}`,
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
            onClick={() => updateFavorites([], { sync: true })}
            disabled={favoritesEmpty}
          >
            {t('favorites.clear')}
          </button>
          {favoritesSyncError && (
            <small className="warning" role="alert">
              Google Sheets: {favoritesSyncError}
            </small>
          )}
          {isFavoritesSyncing && <small>{language === 'ru' ? 'Синхронизация…' : 'Syncing…'}</small>}
        </header>

        {favoritesEmpty ? (
          <p className="empty-state">{t('favorites.empty')}</p>
        ) : (
          <div className="favorites-list">
            {favoriteList.map(item => (
              <div className="favorite-item" key={item.id}>
                <div>
                  <strong>{item.name || t('chart.unnamed')}</strong>
                  <div className="favorite-meta">
                    <span>
                      {t('favorites.priceLabel')}: <strong>{item.price}</strong> ₽
                    </span>
                    <span>
                      {t('favorites.unitsLabel')}: <strong>{item.weight}</strong>
                    </span>
                    <span>
                      {item.pricePerUnit.toFixed(2)} {t('favorites.perUnit')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() =>
                    updateFavorites(prev => prev.filter(fav => fav.id !== item.id))
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

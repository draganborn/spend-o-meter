import { useMemo, useState } from 'react';
import { useLanguage } from '../../context/AppProviders';

const defaultStation = () => ({
  id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  name: '',
  price: '',
  discountType: 'none',
  cashback: '',
  fixed: '',
});

const calculateFinalPrice = station => {
  const price = parseFloat(station.price) || 0;
  if (station.discountType === 'cashback') {
    const cashback = parseFloat(station.cashback) || 0;
    return price * (1 - cashback / 100);
  }
  if (station.discountType === 'fixed') {
    const fixed = parseFloat(station.fixed) || 0;
    return price - fixed;
  }
  return price;
};

export function FuelComparator() {
  const { t } = useLanguage();
  const [stations, setStations] = useState([defaultStation(), defaultStation()]);
  const [result, setResult] = useState(null);

  const addStation = () => setStations(prev => [...prev, defaultStation()]);

  const removeStation = id => setStations(prev => prev.filter(station => station.id !== id));

  const updateStation = (id, field, value) =>
    setStations(prev =>
      prev.map(station => (station.id === id ? { ...station, [field]: value } : station)),
    );

  const compare = event => {
    event?.preventDefault();
    const normalized = stations
      .map(station => ({
        ...station,
        name: station.name || '',
        price: parseFloat(station.price) || 0,
        finalPrice: calculateFinalPrice(station),
      }))
      .filter(station => station.price > 0);

    if (normalized.length < 2) {
      alert(t('alerts.notEnoughStations'));
      setResult(null);
      return;
    }

    normalized.sort((a, b) => a.finalPrice - b.finalPrice);
    const best = normalized[0];
    const comparisons = normalized.slice(1).map(station => ({
      ...station,
      diff: ((station.finalPrice / best.finalPrice - 1) * 100).toFixed(1),
    }));

    setResult({ best, comparisons });
  };

  const fuel = useMemo(() => t('fuel'), [t]);

  return (
    <section className="card">
      <header className="section-header">
        <h3>{fuel.title}</h3>

      </header>

      <form className="stack gap-md" onSubmit={compare}>
        {stations.map(station => (
          <div className="card" key={station.id}>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => removeStation(station.id)}
            >
              ×
            </button>
            <div className="stack gap-sm">
              <label>
                {fuel.field.typeLabel}
                <input
                  type="text"
                  value={station.name}
                  onChange={e => updateStation(station.id, 'name', e.target.value)}
                  placeholder={fuel.field.typeLabel}
                />
              </label>
              <label>
                {fuel.field.priceLabel}
                <input
                  type="number"
                  inputMode="decimal"
                  value={station.price}
                  onChange={e => updateStation(station.id, 'price', e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <label>
                {fuel.field.discountLabel}
                <select
                  value={station.discountType}
                  onChange={e => updateStation(station.id, 'discountType', e.target.value)}
                >
                  <option value="none">{fuel.field.discounts.none}</option>
                  <option value="cashback">{fuel.field.discounts.cashback}</option>
                  <option value="fixed">{fuel.field.discounts.fixed}</option>
                </select>
              </label>
              {station.discountType === 'cashback' && (
                <label>
                  {fuel.field.cashbackLabel}
                  <input
                    type="number"
                    inputMode="decimal"
                    value={station.cashback}
                    onChange={e => updateStation(station.id, 'cashback', e.target.value)}
                    placeholder="0"
                  />
                </label>
              )}
              {station.discountType === 'fixed' && (
                <label>
                  {fuel.field.fixedLabel}
                  <input
                    type="number"
                    inputMode="decimal"
                    value={station.fixed}
                    onChange={e => updateStation(station.id, 'fixed', e.target.value)}
                    placeholder="0.00"
                  />
                </label>
              )}
            </div>
          </div>
        ))}

        <button type="submit" className="btn primary">
          {fuel.compareButton}
        </button>
      </form>

      {result && (
        <div className="result-container">
          <p>
            {fuel.result.better}:{' '}
            <strong>
              {result.best.name || '—'} ({result.best.finalPrice.toFixed(2)}{' '}
              {fuel.result.perLiter})
            </strong>
          </p>
          {result.comparisons.map(station => (
            <p key={`${station.name}-${station.diff}`}>
              {station.name || '—'}: {fuel.result.moreExpensive} {station.diff}%
            </p>
          ))}
        </div>
      )}
      <button type="button" className="btn secondary" onClick={addStation}>
          {fuel.addButton}
        </button>
    </section>
  );
}

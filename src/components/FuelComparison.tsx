import { useState, type FormEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { FuelStation } from '../types';

export const FuelComparison = () => {
  const { t } = useLanguage();
  const [stations, setStations] = useState<FuelStation[]>([
    {
      name: 'Teboil',
      price: 0,
      discountType: 'cashback',
      cashback: 0,
      fixed: 0,
      finalPrice: 0,
    },
  ]);
  const [result, setResult] = useState<string | null>(null);

  const addStation = () => {
    setStations([
      ...stations,
      {
        name: '',
        price: 0,
        discountType: 'none',
        cashback: 0,
        fixed: 0,
        finalPrice: 0,
      },
    ]);
  };

  const removeStation = (index: number) => {
    setStations(stations.filter((_, i) => i !== index));
  };

  const updateStation = (
    index: number,
    field: keyof FuelStation,
    value: string | number
  ) => {
    const updated = [...stations];
    updated[index] = { ...updated[index], [field]: value };
    setStations(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const processed = stations
      .filter((s) => s.price > 0)
      .map((s) => {
        let finalPrice = s.price;
        if (s.discountType === 'cashback') {
          finalPrice = s.price * (1 - s.cashback / 100);
        } else if (s.discountType === 'fixed') {
          finalPrice = s.price - s.fixed;
        }
        return { ...s, finalPrice };
      });

    if (processed.length < 2) {
      alert(t.alerts.notEnoughStations);
      return;
    }

    const sorted = [...processed].sort((a, b) => a.finalPrice - b.finalPrice);
    const best = sorted[0];

    let resultHtml = `${t.result.better}: <strong>${
      best.name
    }</strong> (${best.finalPrice.toFixed(2)} ${t.result.perLiter})<br><br>`;

    for (let i = 1; i < sorted.length; i++) {
      const diff = (sorted[i].finalPrice / best.finalPrice - 1) * 100;
      resultHtml += `${sorted[i].name}: ${t.result.moreExpensive} ${diff.toFixed(
        1
      )}%<br>`;
    }

    setResult(resultHtml);
  };

  return (
    <div className="card-container">
      <h2>{t.comparisonFuel}</h2>
      <form onSubmit={handleSubmit}>
        <div id="stationsContainer">
          {stations.map((station, index) => (
            <div key={index} className="card">
              <button
                type="button"
                className="delete-btn"
                onClick={() => removeStation(index)}
              >
                ×
              </button>
              <div className="input-group">
                <label>{t.stationField.typeLabel}</label>
                <input
                  type="text"
                  className="fuel-name"
                  placeholder={t.stationField.typeLabel}
                  value={station.name}
                  onChange={(e) => updateStation(index, 'name', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>{t.stationField.priceLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  className="fuel-price"
                  value={station.price || ''}
                  onChange={(e) =>
                    updateStation(index, 'price', Number(e.target.value))
                  }
                  required
                />
              </div>
              <div className="input-group">
                <label>{t.stationField.discountLabel}</label>
                <select
                  className="discount-select"
                  value={station.discountType}
                  onChange={(e) =>
                    updateStation(
                      index,
                      'discountType',
                      e.target.value as 'none' | 'cashback' | 'fixed'
                    )
                  }
                >
                  <option value="none">{t.stationField.discounts.none}</option>
                  <option value="cashback">
                    {t.stationField.discounts.cashback}
                  </option>
                  <option value="fixed">{t.stationField.discounts.fixed}</option>
                </select>
              </div>
              {station.discountType === 'cashback' && (
                <div className="input-group">
                  <label>{t.stationField.cashbackLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="cashback-value"
                    value={station.cashback || ''}
                    onChange={(e) =>
                      updateStation(index, 'cashback', Number(e.target.value))
                    }
                  />
                </div>
              )}
              {station.discountType === 'fixed' && (
                <div className="input-group">
                  <label>{t.stationField.fixedLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="fixed-value"
                    value={station.fixed || ''}
                    onChange={(e) =>
                      updateStation(index, 'fixed', Number(e.target.value))
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="btn-group">
          <button type="button" className="add-btn" onClick={addStation}>
            {t.addStationBtn}
          </button>
          <button type="submit" className="submit-btn">
            {t.fuelCompareBtn}
          </button>
        </div>
      </form>
      {result && (
        <div
          className="result-container"
          style={{ display: 'block' }}
          dangerouslySetInnerHTML={{ __html: result }}
        />
      )}
    </div>
  );
};

import { useState, type FormEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product } from '../types';

export const ProductComparison = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([
    { name: '', price: 0, weight: 0 },
  ]);
  const [result, setResult] = useState<string | null>(null);

  const addProduct = () => {
    setProducts([...products, { name: '', price: 0, weight: 0 }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (
    index: number,
    field: keyof Product,
    value: string | number
  ) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const validProducts = products.filter((p) => p.price > 0 && p.weight > 0);

    if (validProducts.length < 2) {
      alert(t.alerts.notEnoughProducts);
      return;
    }

    const sorted = [...validProducts].sort(
      (a, b) => a.price / a.weight - b.price / b.weight
    );
    const best = sorted[0];

    let resultHtml = `${t.result.better}: <strong>${best.name}</strong> (${(
      best.price / best.weight
    ).toFixed(2)} ${t.result.perUnit})<br><br>`;

    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (sorted[i].price / sorted[i].weight / (best.price / best.weight) - 1) *
        100;
      resultHtml += `${sorted[i].name}: ${t.result.moreExpensive} ${diff.toFixed(
        1
      )}%<br>`;
    }

    setResult(resultHtml);
  };

  return (
    <div className="card-container">
      <h2>{t.comparisonProduct}</h2>
      <form onSubmit={handleSubmit}>
        <div id="productsContainer">
          {products.map((product, index) => (
            <div key={index} className="card">
              <button
                type="button"
                className="delete-btn"
                title="×"
                onClick={() => removeProduct(index)}
              >
                ×
              </button>
              <div className="input-group">
                <label>{t.productField.nameLabel}</label>
                <input
                  type="text"
                  value={product.name}
                  placeholder={t.productField.namePlaceholder}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>{t.productField.priceLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  value={product.price || ''}
                  placeholder="0.00"
                  onChange={(e) =>
                    updateProduct(index, 'price', Number(e.target.value))
                  }
                  required
                />
              </div>
              <div className="input-group">
                <label>{t.productField.weightLabel}</label>
                <input
                  type="number"
                  step="0.01"
                  value={product.weight || ''}
                  placeholder="0.00"
                  onChange={(e) =>
                    updateProduct(index, 'weight', Number(e.target.value))
                  }
                  required
                />
              </div>
            </div>
          ))}
        </div>
        <div className="btn-group">
          <button type="button" className="add-btn" onClick={addProduct}>
            {t.addProductBtn}
          </button>
          <button type="submit" className="submit-btn">
            {t.productCompareBtn}
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

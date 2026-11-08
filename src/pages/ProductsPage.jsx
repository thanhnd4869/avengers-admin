import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import Icon from "@components/Icon";
import { FilterTabs, ListState, Pagination, SearchBox } from "@components/ListControls";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getProducts, setProductPublished } from "@services/adminService";
import { formatMoney, formatNumber } from "@utils/format";

const FILTERS = [
  { value: "", label: "All games" },
  { value: "true", label: "Published" },
  { value: "false", label: "Hidden" },
];
export const LOW_STOCK = 5;

export function stockClass(keys) {
  if (keys === 0) return "stock-out";
  if (keys <= LOW_STOCK) return "stock-low";
  return "";
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [published, setPublished] = useState(() => searchParams.get("published") ?? "");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const { data, error, loading, refresh } = useApi(
    () => getProducts({ page, published, q: search }),
    `${page}|${published}|${search}`,
  );
  const products = (data?.data ?? []).map((product) => overrides[product.id] ?? product);

  async function togglePublished(product) {
    const next = !product.published;
    if (!next && !window.confirm(`Hide "${product.name}" from the shop?`)) return;

    setSavingId(product.id);
    setActionError("");
    try {
      const { data: updated } = await setProductPublished(product.id, next);
      setOverrides((current) => ({ ...current, [updated.id]: updated }));
    } catch (cause) {
      setActionError(cause.message || "Could not update the game.");
    } finally {
      setSavingId(null);
    }
  }

  function changeFilter(update) {
    update();
    setPage(1);
    setOverrides({});
  }

  return (
    <>
      <PageHeading
        eyebrow="CATALOGUE"
        title="Products"
        description="Games, their editions and key stock. Hide a game to take it off the shop."
        actions={
          <>
            <RefreshButton
              disabled={loading}
              onClick={() => {
                setOverrides({});
                refresh();
              }}
            />
            <Link className="primary-button" to="/products/new">
              <Icon name="add" size={12} /> New game
            </Link>
          </>
        }
      />
      <Notice onClose={() => setActionError("")}>{actionError}</Notice>
      <section className="panel">
        <div className="inbox-toolbar">
          <FilterTabs
            items={FILTERS}
            value={published}
            label="Filter games"
            onChange={(value) => changeFilter(() => setPublished(value))}
          />
          <SearchBox
            value={search}
            placeholder="Game name"
            onChange={(value) => changeFilter(() => setSearch(value))}
          />
        </div>
        <ListState
          loading={loading}
          error={error}
          empty={products.length === 0}
          emptyText="No games match."
        />
        {!loading && products.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Variants</th>
                  <th className="numeric">Keys</th>
                  <th className="numeric">Sold</th>
                  <th>Rating</th>
                  <th>Shop</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={product.published ? "" : "row-muted"}>
                    <td>
                      <Link className="product-cell row-link" to={`/products/${product.id}`}>
                        <img src={product.image?.url} alt="" loading="lazy" />
                        <span>
                          {product.name}
                          <span className="cell-sub">
                            {product.isPreorder ? "Pre-order · " : ""}
                            {product.slug}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td>
                      {product.variants.length === 0 ? (
                        <span className="muted">No variants</span>
                      ) : (
                        <ul className="variant-list">
                          {product.variants.map((variant) => (
                            <li key={variant.id}>
                              <span>
                                {variant.platform?.name ?? "?"} · {variant.edition}
                              </span>
                              <span className="variant-price">{formatMoney(variant.price)}</span>
                              <span
                                className={`variant-stock ${stockClass(variant.availableKeys)}`}
                              >
                                {variant.availableKeys} keys
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className={`numeric ${stockClass(product.availableKeys)}`}>
                      {formatNumber(product.availableKeys)}
                    </td>
                    <td className="numeric">{formatNumber(product.salesCount)}</td>
                    <td className="muted text-nowrap">
                      {product.ratingCount
                        ? `${product.ratingAverage.toFixed(1)} / 5 (${product.ratingCount})`
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`toggle ${product.published ? "on" : ""}`}
                        role="switch"
                        aria-checked={product.published}
                        aria-label={`${product.name} visible in shop`}
                        disabled={savingId === product.id}
                        onClick={() => togglePublished(product)}
                      >
                        <span />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <Pagination meta={data?.meta} page={page} loading={loading} onChange={setPage} />
      </section>
    </>
  );
}

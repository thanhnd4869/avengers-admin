import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import FormField, { fieldErrors } from "@components/FormField";
import Icon from "@components/Icon";
import { ListState } from "@components/ListControls";
import Modal from "@components/Modal";
import { BackLink, Notice, PageHeading, PanelHeading } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import {
  addKeys,
  createProduct,
  createVariant,
  deleteVariant,
  getPlatforms,
  getProduct,
  getProductCategories,
  updateProduct,
  updateVariant,
} from "@services/adminService";
import { formatMoney, formatNumber, slugify } from "@utils/format";

const EMPTY_PRODUCT = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  imageUrl: "",
  releaseDate: new Date().toISOString().slice(0, 10),
  isPreorder: false,
  categoryIds: [],
};

function toForm(product) {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    imageUrl: product.image?.url ?? "",
    releaseDate: product.releaseDate?.slice(0, 10) ?? "",
    isPreorder: product.isPreorder,
    categoryIds: product.categoryIds ?? [],
  };
}

/** Loads the product once, then hands it to the editor as its starting state. */
export default function ProductEditPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const lookups = useApi(() => Promise.all([getPlatforms(), getProductCategories()]), "lookups");
  const product = useApi(() => (isNew ? Promise.resolve({ data: null }) : getProduct(id)), id);

  if (lookups.loading || product.loading || lookups.error || product.error) {
    return (
      <>
        <BackLink to="/products">All products</BackLink>
        <ListState
          loading={lookups.loading || product.loading}
          error={lookups.error || product.error}
        />
      </>
    );
  }

  return (
    <ProductEditor
      key={id}
      initial={product.data.data}
      platforms={lookups.data[0].data}
      categories={lookups.data[1].data}
    />
  );
}

function ProductEditor({ initial, platforms, categories }) {
  const navigate = useNavigate();
  const [product, setProduct] = useState(initial);
  const [form, setForm] = useState(() => (initial ? toForm(initial) : EMPTY_PRODUCT));
  // A new game's slug follows its name until the slug is edited by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [variantModal, setVariantModal] = useState(null);
  const [keysFor, setKeysFor] = useState(null);
  const errors = fieldErrors(error);

  function set(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  function toggleCategory(categoryId) {
    set(
      "categoryIds",
      form.categoryIds.includes(categoryId)
        ? form.categoryIds.filter((idValue) => idValue !== categoryId)
        : [...form.categoryIds, categoryId],
    );
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice("");
    try {
      if (product) {
        const { data } = await updateProduct(product.id, form);
        setProduct(data);
        setForm(toForm(data));
        setNotice("Changes saved.");
      } else {
        const { data } = await createProduct(form);
        navigate(`/products/${data.id}`, { replace: true });
      }
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished() {
    if (product.published && !window.confirm(`Hide "${product.name}" from the shop?`)) return;
    setError(null);
    try {
      const { data } = await updateProduct(product.id, { published: !product.published });
      setProduct(data);
      setNotice(data.published ? "The game is live in the shop." : "The game is hidden.");
    } catch (cause) {
      setError(cause);
    }
  }

  async function removeVariant(variant) {
    if (!window.confirm(`Delete the ${variant.platform?.name} · ${variant.edition} variant?`)) {
      return;
    }
    setError(null);
    try {
      const { data } = await deleteVariant(product.id, variant.id);
      setProduct(data);
      setNotice("Variant deleted.");
    } catch (cause) {
      setError(cause);
    }
  }

  const sellable = product?.variants.some((variant) => variant.availableKeys > 0);

  return (
    <>
      <BackLink to="/products">All products</BackLink>
      <PageHeading
        eyebrow="CATALOGUE"
        title={product ? product.name : "New game"}
        description={
          product
            ? `/${product.slug}`
            : "New games start hidden. Add a variant and keys, then publish."
        }
        actions={
          product ? (
            <button
              type="button"
              className={product.published ? "secondary-button" : "primary-button"}
              onClick={togglePublished}
            >
              <Icon name={product.published ? "hidden" : "visible"} size={12} />
              {product.published ? "Hide from shop" : "Publish"}
            </button>
          ) : null
        }
      />

      <Notice tone="success" onClose={() => setNotice("")}>
        {notice}
      </Notice>
      <Notice onClose={() => setError(null)}>{error?.message}</Notice>
      {product && !product.published && !sellable ? (
        <Notice tone="warning">
          Not visible in the shop yet: add a variant with at least one key, then publish.
        </Notice>
      ) : null}

      <form className="panel form-panel" onSubmit={save} noValidate>
        <PanelHeading eyebrow="DETAILS" title="Game" />
        <div className="form-grid">
          <FormField id="name" label="Name" error={errors.name}>
            <input
              id="name"
              value={form.name}
              maxLength={120}
              required
              onChange={(event) => set("name", event.target.value)}
            />
          </FormField>
          <FormField id="slug" label="URL slug" error={errors.slug} hint="Used in the shop URL.">
            <input
              id="slug"
              value={form.slug}
              maxLength={120}
              required
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", event.target.value);
              }}
            />
          </FormField>
          <FormField
            id="imageUrl"
            label="Cover image URL"
            error={errors.imageUrl}
            className="span-2"
          >
            <div className="image-input">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" />
              ) : (
                <span className="image-placeholder">
                  <Icon name="products" size={16} />
                </span>
              )}
              <input
                id="imageUrl"
                type="url"
                value={form.imageUrl}
                maxLength={2000}
                required
                placeholder="https://…"
                onChange={(event) => set("imageUrl", event.target.value)}
              />
            </div>
          </FormField>
          <FormField id="releaseDate" label="Release date" error={errors.releaseDate}>
            <input
              id="releaseDate"
              type="date"
              value={form.releaseDate}
              required
              onChange={(event) => set("releaseDate", event.target.value)}
            />
          </FormField>
          <div className="form-field">
            <span className="field-label">Availability</span>
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.isPreorder}
                onChange={(event) => set("isPreorder", event.target.checked)}
              />
              Pre-order
            </label>
          </div>
          <FormField
            id="shortDescription"
            label="Short description"
            error={errors.shortDescription}
            hint="Shown on product cards. Up to 300 characters."
            className="span-2"
          >
            <textarea
              id="shortDescription"
              rows={2}
              maxLength={300}
              value={form.shortDescription}
              onChange={(event) => set("shortDescription", event.target.value)}
            />
          </FormField>
          <FormField
            id="description"
            label="Description"
            error={errors.description}
            className="span-2"
          >
            <textarea
              id="description"
              rows={6}
              maxLength={10000}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </FormField>
          <div className="form-field span-2">
            <span className="field-label">Categories</span>
            <div className="chip-group">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`chip ${form.categoryIds.includes(category.id) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  {form.categoryIds.includes(category.id) ? <Icon name="check" size={10} /> : null}
                  {category.name}
                </label>
              ))}
            </div>
            {errors.categoryIds ? <div className="field-error">{errors.categoryIds}</div> : null}
          </div>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={saving}>
            <Icon name="check" size={12} />
            {saving ? "Saving…" : product ? "Save changes" : "Create game"}
          </button>
        </div>
      </form>

      {product ? (
        <section className="panel section-gap">
          <PanelHeading eyebrow="PRICING & STOCK" title="Variants">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setVariantModal({ variant: null })}
            >
              <Icon name="add" size={12} /> Add variant
            </button>
          </PanelHeading>
          {product.variants.length === 0 ? (
            <div className="empty-state">
              No variants yet. A variant is one platform and edition with its own price and keys.
            </div>
          ) : (
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Edition</th>
                    <th className="numeric">Price</th>
                    <th className="numeric">Was</th>
                    <th className="numeric">Available</th>
                    <th className="numeric">Held</th>
                    <th className="numeric">Sold</th>
                    <th className="actions-col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={variant.id}>
                      <td>
                        <strong>{variant.platform?.name ?? "Unknown"}</strong>
                      </td>
                      <td>{variant.edition}</td>
                      <td className="numeric">{formatMoney(variant.price)}</td>
                      <td className="numeric muted">
                        {variant.originalPrice ? formatMoney(variant.originalPrice) : "—"}
                      </td>
                      <td
                        className={`numeric ${variant.availableKeys === 0 ? "stock-out" : variant.availableKeys <= 5 ? "stock-low" : ""}`}
                      >
                        {formatNumber(variant.availableKeys)}
                      </td>
                      <td className="numeric muted">{formatNumber(variant.keys.reserved)}</td>
                      <td className="numeric muted">{formatNumber(variant.keys.sold)}</td>
                      <td className="actions-col">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="secondary-button compact"
                            onClick={() => setKeysFor(variant)}
                          >
                            <Icon name="key" size={11} /> Add keys
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit variant"
                            onClick={() => setVariantModal({ variant })}
                          >
                            <Icon name="edit" size={12} />
                            <span className="visually-hidden">Edit variant</span>
                          </button>
                          {variant.keys.available + variant.keys.reserved + variant.keys.sold ===
                          0 ? (
                            <button
                              type="button"
                              className="icon-button danger"
                              title="Delete variant"
                              onClick={() => removeVariant(variant)}
                            >
                              <Icon name="delete" size={12} />
                              <span className="visually-hidden">Delete variant</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {variantModal ? (
        <VariantModal
          productId={product.id}
          variant={variantModal.variant}
          platforms={platforms}
          onClose={() => setVariantModal(null)}
          onSaved={(updated, message) => {
            setProduct(updated);
            setVariantModal(null);
            setNotice(message);
          }}
        />
      ) : null}
      {keysFor ? (
        <KeysModal
          productId={product.id}
          variant={keysFor}
          onClose={() => setKeysFor(null)}
          onSaved={(result) => {
            setProduct(result.product);
            setKeysFor(null);
            setNotice(
              `${result.added} keys added${result.skippedRepeats ? `, ${result.skippedRepeats} repeated lines skipped` : ""}.`,
            );
          }}
        />
      ) : null}
    </>
  );
}

function VariantModal({ productId, variant, platforms, onClose, onSaved }) {
  const [form, setForm] = useState({
    platformId: variant?.platform?.id ?? platforms[0]?.id ?? "",
    edition: variant?.edition ?? "Standard",
    price: variant ? String(variant.price) : "",
    originalPrice: variant?.originalPrice ? String(variant.originalPrice) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const errors = fieldErrors(error);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      platformId: form.platformId,
      edition: form.edition,
      price: Number(form.price),
      originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
    };
    try {
      const { data } = variant
        ? await updateVariant(productId, variant.id, body)
        : await createVariant(productId, body);
      onSaved(data, variant ? "Variant updated." : "Variant added. Add keys to start selling it.");
    } catch (cause) {
      setError(cause);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={variant ? "Edit variant" : "Add variant"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="variant-form" className="primary-button" disabled={saving}>
            <Icon name="check" size={12} /> {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="variant-form" className="form-grid" onSubmit={submit} noValidate>
        {error && !Object.keys(errors).length ? (
          <Notice className="span-2">{error.message}</Notice>
        ) : null}
        <FormField id="platformId" label="Platform" error={errors.platformId}>
          <select
            id="platformId"
            value={form.platformId}
            onChange={(event) => setForm({ ...form, platformId: event.target.value })}
          >
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
                {platform.published ? "" : " (hidden)"}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="edition" label="Edition" error={errors.edition}>
          <input
            id="edition"
            value={form.edition}
            maxLength={60}
            onChange={(event) => setForm({ ...form, edition: event.target.value })}
          />
        </FormField>
        <FormField id="price" label="Price (₫)" error={errors.price}>
          <input
            id="price"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
          />
        </FormField>
        <FormField
          id="originalPrice"
          label="Original price (₫)"
          error={errors.originalPrice}
          hint="Leave empty when there is no discount."
        >
          <input
            id="originalPrice"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            value={form.originalPrice}
            onChange={(event) => setForm({ ...form, originalPrice: event.target.value })}
          />
        </FormField>
      </form>
    </Modal>
  );
}

function KeysModal({ productId, variant, onClose, onSaved }) {
  const [codes, setCodes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const count = codes.split(/[\r\n,]+/).filter((line) => line.trim()).length;

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data } = await addKeys(productId, variant.id, codes);
      onSaved(data);
    } catch (cause) {
      setError(cause);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Add keys · ${variant.platform?.name} ${variant.edition}`}
      onClose={onClose}
      footer={
        <>
          <span className="dialog-foot-note">{count} codes</span>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="keys-form"
            className="primary-button"
            disabled={saving || count === 0}
          >
            <Icon name="key" size={12} /> {saving ? "Adding…" : "Add keys"}
          </button>
        </>
      }
    >
      <form id="keys-form" onSubmit={submit}>
        <Notice>{error?.message}</Notice>
        <FormField
          id="codes"
          label="Activation codes"
          hint="One code per line, up to 1000 at a time. Codes are encrypted when saved and cannot be read back here."
        >
          <textarea
            id="codes"
            className="mono"
            rows={10}
            value={codes}
            autoComplete="off"
            spellCheck={false}
            placeholder={"XXXXX-XXXXX-XXXXX\nXXXXX-XXXXX-XXXXX"}
            onChange={(event) => setCodes(event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}

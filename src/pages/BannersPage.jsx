import { useState } from "react";

import FormField, { fieldErrors } from "@components/FormField";
import Icon from "@components/Icon";
import { ListState } from "@components/ListControls";
import MediaInput from "@components/MediaInput";
import Modal from "@components/Modal";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { createBanner, deleteBanner, getBanners, updateBanner } from "@services/adminService";

export default function BannersPage() {
  const { data, error, loading, refresh } = useApi(getBanners, "banners");
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const banners = data?.data ?? [];
  const nextSortOrder = banners.reduce((max, banner) => Math.max(max, banner.sortOrder + 1), 0);

  async function run(banner, action, message) {
    setBusyId(banner.id);
    setActionError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      refresh();
    } catch (cause) {
      setActionError(cause.message || "Could not update the banner.");
    } finally {
      setBusyId(null);
    }
  }

  function togglePublished(banner) {
    if (banner.published && !window.confirm(`Hide "${banner.title}" from the home page?`)) return;
    run(
      banner,
      () => updateBanner(banner.id, { published: !banner.published }),
      banner.published ? "Banner hidden." : "Banner is live on the home page.",
    );
  }

  function remove(banner) {
    if (!window.confirm(`Delete the banner "${banner.title}"? This cannot be undone.`)) return;
    run(banner, () => deleteBanner(banner.id), "Banner deleted.");
  }

  return (
    <>
      <PageHeading
        eyebrow="CONTENT"
        title="Home banners"
        description="The slides at the top of the shop's home page, shown in order."
        actions={
          <>
            <RefreshButton disabled={loading} onClick={refresh} />
            <button
              type="button"
              className="primary-button"
              onClick={() => setEditing({ banner: null })}
            >
              <Icon name="add" size={12} /> New banner
            </button>
          </>
        }
      />
      <Notice tone="success" onClose={() => setNotice("")}>
        {notice}
      </Notice>
      <Notice onClose={() => setActionError("")}>{actionError}</Notice>
      <section className="panel">
        <ListState
          loading={loading}
          error={error}
          empty={banners.length === 0}
          emptyText="No banners yet. The home page shows no slider without one."
        />
        {!loading && banners.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="numeric">Order</th>
                  <th>Banner</th>
                  <th>Link</th>
                  <th>Shop</th>
                  <th className="actions-col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} className={banner.published ? "" : "row-muted"}>
                    <td className="numeric muted">{banner.sortOrder}</td>
                    <td>
                      <div className="product-cell banner-cell">
                        <img src={banner.image?.url} alt="" loading="lazy" />
                        <span>
                          <strong>{banner.title}</strong>
                          <span className="cell-sub">{banner.excerpt}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      {banner.linkUrl ? (
                        <>
                          {banner.linkLabel || "Link"}
                          <span className="cell-sub mono">{banner.linkUrl}</span>
                        </>
                      ) : (
                        <span className="muted">None</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`toggle ${banner.published ? "on" : ""}`}
                        role="switch"
                        aria-checked={banner.published}
                        aria-label={`${banner.title} visible on the home page`}
                        disabled={busyId === banner.id}
                        onClick={() => togglePublished(banner)}
                      >
                        <span />
                      </button>
                    </td>
                    <td className="actions-col">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Edit banner"
                          onClick={() => setEditing({ banner })}
                        >
                          <Icon name="edit" size={12} />
                          <span className="visually-hidden">Edit banner</span>
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          title="Delete banner"
                          disabled={busyId === banner.id}
                          onClick={() => remove(banner)}
                        >
                          <Icon name="delete" size={12} />
                          <span className="visually-hidden">Delete banner</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {editing ? (
        <BannerModal
          banner={editing.banner}
          nextSortOrder={nextSortOrder}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
            refresh();
          }}
        />
      ) : null}
    </>
  );
}

function BannerModal({ banner, nextSortOrder, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: banner?.title ?? "",
    excerpt: banner?.excerpt ?? "",
    imageUrl: banner?.image?.url ?? "",
    linkUrl: banner?.linkUrl ?? "",
    linkLabel: banner?.linkLabel ?? "",
    sortOrder: String(banner?.sortOrder ?? nextSortOrder),
    // New banners start hidden, like games and posts, until checked.
    published: banner?.published ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const errors = fieldErrors(error);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body = { ...form, sortOrder: Number(form.sortOrder) };
    try {
      if (banner) await updateBanner(banner.id, body);
      else await createBanner(body);
      onSaved(banner ? "Banner updated." : "Banner created.");
    } catch (cause) {
      setError(cause);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={banner ? "Edit banner" : "New banner"}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="banner-form" className="primary-button" disabled={saving}>
            <Icon name="check" size={12} /> {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="banner-form" className="form-grid" onSubmit={submit} noValidate>
        {error && !Object.keys(errors).length ? (
          <Notice className="span-2">{error.message}</Notice>
        ) : null}
        <FormField id="title" label="Title" error={errors.title} className="span-2">
          <input
            id="title"
            value={form.title}
            maxLength={120}
            onChange={(event) => set("title", event.target.value)}
          />
        </FormField>
        <FormField
          id="excerpt"
          label="Text"
          error={errors.excerpt}
          hint="One or two sentences under the title. Up to 300 characters."
          className="span-2"
        >
          <textarea
            id="excerpt"
            rows={2}
            maxLength={300}
            value={form.excerpt}
            onChange={(event) => set("excerpt", event.target.value)}
          />
        </FormField>
        <FormField
          id="imageUrl"
          label="Image"
          error={errors.imageUrl}
          hint="Paste an image URL or upload a file."
          className="span-2"
        >
          <MediaInput
            id="imageUrl"
            value={form.imageUrl}
            placeholderIcon="banners"
            onChange={(value) => set("imageUrl", value)}
          />
        </FormField>
        <FormField
          id="linkUrl"
          label="Link"
          error={errors.linkUrl}
          hint="A shop path such as /products/elden-ring, or a full URL. Optional."
        >
          <input
            id="linkUrl"
            value={form.linkUrl}
            maxLength={2000}
            placeholder="/products/…"
            onChange={(event) => set("linkUrl", event.target.value)}
          />
        </FormField>
        <FormField id="linkLabel" label="Button label" error={errors.linkLabel}>
          <input
            id="linkLabel"
            value={form.linkLabel}
            maxLength={40}
            placeholder="Shop now"
            onChange={(event) => set("linkLabel", event.target.value)}
          />
        </FormField>
        <FormField
          id="sortOrder"
          label="Order"
          error={errors.sortOrder}
          hint="Lower numbers come first."
        >
          <input
            id="sortOrder"
            type="number"
            min={0}
            max={10000}
            step={1}
            inputMode="numeric"
            value={form.sortOrder}
            onChange={(event) => set("sortOrder", event.target.value)}
          />
        </FormField>
        <div className="form-field">
          <span className="field-label">Home page</span>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => set("published", event.target.checked)}
            />
            Show this banner
          </label>
        </div>
      </form>
    </Modal>
  );
}

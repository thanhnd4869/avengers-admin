import { useState } from "react";

import FormField, { fieldErrors } from "@components/FormField";
import Icon from "@components/Icon";
import { ListState } from "@components/ListControls";
import MediaInput, { UploadButton } from "@components/MediaInput";
import Modal from "@components/Modal";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import {
  createGallery,
  createMedia,
  createPlatform,
  createPostCategory,
  createProductCategory,
  createSocialLink,
  deleteGallery,
  deleteMedia,
  deletePlatform,
  deletePostCategory,
  deleteProductCategory,
  deleteSocialLink,
  getGalleries,
  getMedia,
  getPlatforms,
  getPostCategories,
  getProductCategories,
  getSocialLinks,
  updateGallery,
  updateMedia,
  updatePlatform,
  updatePostCategory,
  updateProductCategory,
  updateSocialLink,
} from "@services/adminService";

const COLLECTIONS = {
  galleries: {
    title: "Galleries",
    description: "Manage the published albums and their image order.",
    itemLabel: "gallery",
    load: getGalleries,
    create: createGallery,
    update: updateGallery,
    remove: deleteGallery,
    primary: (item) => item.title,
    secondary: (item) => `/${item.slug}`,
    image: (item) => item.cover?.url,
    fields: ["title", "slug", "coverUrl", "coverAlt", "images", "sortOrder", "published"],
  },
  media: {
    title: "Media library",
    description: "Manage standalone screenshots and video entries shown in the gallery.",
    itemLabel: "media item",
    load: getMedia,
    create: createMedia,
    update: updateMedia,
    remove: deleteMedia,
    primary: (item) => item.title || item.type,
    secondary: (item) => item.type,
    image: (item) => item.image?.url,
    fields: ["type", "title", "imageUrl", "imageAlt", "url", "sortOrder", "published"],
  },
  "social-links": {
    title: "Social links",
    description: "Manage the networks displayed in the shop footer.",
    itemLabel: "social link",
    load: getSocialLinks,
    create: createSocialLink,
    update: updateSocialLink,
    remove: deleteSocialLink,
    primary: (item) => item.label,
    secondary: (item) => `${item.network} · ${item.url}`,
    fields: ["network", "label", "url", "sortOrder", "published"],
  },
  platforms: {
    title: "Platforms",
    description: "Manage storefront platform filters and product variant platforms.",
    itemLabel: "platform",
    load: getPlatforms,
    create: createPlatform,
    update: updatePlatform,
    remove: deletePlatform,
    primary: (item) => item.name,
    secondary: (item) => `/${item.slug}`,
    image: (item) => item.image?.url,
    fields: ["name", "slug", "imageUrl", "imageAlt", "sortOrder", "published"],
  },
  "product-categories": {
    title: "Product categories",
    description:
      "Organize games by genre. Categories in use must be detached from products before deletion.",
    itemLabel: "product category",
    load: getProductCategories,
    create: createProductCategory,
    update: updateProductCategory,
    remove: deleteProductCategory,
    primary: (item) => item.name,
    secondary: (item) => `/${item.slug}`,
    fields: ["name", "slug", "sortOrder"],
  },
  "post-categories": {
    title: "Blog categories",
    description:
      "Organize blog posts. Categories in use must be detached from posts before deletion.",
    itemLabel: "blog category",
    load: getPostCategories,
    create: createPostCategory,
    update: updatePostCategory,
    remove: deletePostCategory,
    primary: (item) => item.name,
    secondary: (item) => `/${item.slug}`,
    fields: ["name", "slug", "sortOrder"],
  },
};

function initialForm(collection, item, nextSortOrder) {
  return {
    name: item?.name ?? "",
    slug: item?.slug ?? "",
    title: item?.title ?? "",
    type: item?.type ?? "screenshot",
    network: item?.network ?? "",
    label: item?.label ?? "",
    url: item?.url ?? "",
    imageUrl: item?.image?.url ?? "",
    imageAlt: item?.image?.alt ?? "",
    coverUrl: item?.cover?.url ?? "",
    coverAlt: item?.cover?.alt ?? "",
    images: item?.images?.map((image) => `${image.url} | ${image.alt}`).join("\n") ?? "",
    sortOrder: String(item?.sortOrder ?? nextSortOrder),
    published: item?.published ?? false,
  };
}

function toPayload(collection, form) {
  const body = { ...form, sortOrder: Number(form.sortOrder) };
  if (collection === "galleries") {
    body.images = form.images
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [url, ...alt] = line.split("|");
        return { url: url.trim(), alt: alt.join("|").trim() || "Gallery image" };
      });
  }
  delete body.imagesText;
  return body;
}

function altFromFileName(name) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim() || "Gallery image"
  );
}

const FIELD_LABELS = {
  name: "Name",
  slug: "Slug",
  title: "Title",
  network: "Network key",
  label: "Display label",
  url: "Target URL",
  imageUrl: "Image",
  imageAlt: "Image alt text",
  coverUrl: "Cover image",
  coverAlt: "Cover alt text",
  images: "Album images",
  sortOrder: "Display order",
};

export default function ContentCollectionPage({ collection }) {
  const config = COLLECTIONS[collection];
  const { data, error, loading, refresh } = useApi(config.load, collection);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const items = data?.data ?? [];
  const nextSortOrder = items.reduce((max, item) => Math.max(max, (item.sortOrder ?? -1) + 1), 0);

  async function run(item, action, message) {
    setBusyId(item?.id ?? "new");
    setActionError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      refresh();
    } catch (cause) {
      setActionError(cause.message || `Could not update ${config.itemLabel}.`);
    } finally {
      setBusyId("");
    }
  }

  function togglePublished(item) {
    if (item.published && !window.confirm(`Hide "${config.primary(item)}" from the shop?`)) return;
    run(
      item,
      () => config.update(item.id, { published: !item.published }),
      item.published ? "Item hidden." : "Item published.",
    );
  }

  function remove(item) {
    if (!window.confirm(`Delete "${config.primary(item)}"? This cannot be undone.`)) return;
    run(item, () => config.remove(item.id), `${config.itemLabel} deleted.`);
  }

  return (
    <>
      <PageHeading
        eyebrow="CONTENT"
        title={config.title}
        description={config.description}
        actions={
          <>
            <RefreshButton disabled={loading} onClick={refresh} />
            <button
              type="button"
              className="primary-button"
              onClick={() => setEditing({ item: null })}
            >
              <Icon name="add" size={12} /> New {config.itemLabel}
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
          empty={items.length === 0}
          emptyText={`No ${config.title.toLowerCase()} yet.`}
        />
        {!loading && items.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="numeric">Order</th>
                  <th>{config.title}</th>
                  {config.fields.includes("published") ? <th>Published</th> : null}
                  <th className="actions-col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className={item.published === false ? "row-muted" : ""}>
                    <td className="numeric muted">{item.sortOrder ?? 0}</td>
                    <td>
                      <div className="product-cell">
                        {config.image?.(item) ? (
                          <img src={config.image(item)} alt="" loading="lazy" />
                        ) : null}
                        <span>
                          <strong>{config.primary(item)}</strong>
                          <span className="cell-sub">{config.secondary(item)}</span>
                        </span>
                      </div>
                    </td>
                    {config.fields.includes("published") ? (
                      <td>
                        <button
                          type="button"
                          className={`toggle ${item.published ? "on" : ""}`}
                          role="switch"
                          aria-checked={Boolean(item.published)}
                          aria-label={`${config.primary(item)} published`}
                          disabled={busyId === item.id}
                          onClick={() => togglePublished(item)}
                        >
                          <span />
                        </button>
                      </td>
                    ) : null}
                    <td className="actions-col">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title={`Edit ${config.itemLabel}`}
                          onClick={() => setEditing({ item })}
                        >
                          <Icon name="edit" size={12} />
                          <span className="visually-hidden">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          title={`Delete ${config.itemLabel}`}
                          disabled={busyId === item.id}
                          onClick={() => remove(item)}
                        >
                          <Icon name="delete" size={12} />
                          <span className="visually-hidden">Delete</span>
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
        <CollectionModal
          collection={collection}
          config={config}
          item={editing.item}
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

function CollectionModal({ collection, config, item, nextSortOrder, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(collection, item, nextSortOrder));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const errors = fieldErrors(error);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = toPayload(collection, form);
      if (item) await config.update(item.id, body);
      else await config.create(body);
      onSaved(item ? `${config.itemLabel} updated.` : `${config.itemLabel} created.`);
    } catch (cause) {
      setError(cause);
      setSaving(false);
    }
  }

  function renderField(field) {
    if (field === "published") {
      return (
        <div className="form-field" key={field}>
          <span className="field-label">Visibility</span>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => set(field, event.target.checked)}
            />
            Show this item in the shop
          </label>
        </div>
      );
    }
    if (field === "images") {
      return (
        <FormField
          key={field}
          id={field}
          label={FIELD_LABELS[field]}
          error={errors.images || uploadError}
          hint="One image per line: URL | alt text. Uploaded files are added as new lines."
          className="span-2"
        >
          <textarea
            id={field}
            rows={6}
            value={form.images}
            onChange={(event) => set(field, event.target.value)}
          />
          <div className="field-actions">
            <UploadButton
              multiple
              label="Upload images"
              onError={setUploadError}
              onUploaded={(uploaded, file) =>
                setForm((current) => ({
                  ...current,
                  images: [
                    current.images.trimEnd(),
                    `${uploaded.url} | ${altFromFileName(file.name)}`,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                }))
              }
            />
          </div>
        </FormField>
      );
    }
    if (field === "imageUrl" || field === "coverUrl") {
      return (
        <FormField
          key={field}
          id={field}
          label={FIELD_LABELS[field]}
          error={errors[field]}
          hint="Paste an image URL or upload a file."
          className="span-2"
        >
          <MediaInput id={field} value={form[field]} onChange={(value) => set(field, value)} />
        </FormField>
      );
    }
    if (field === "url" && collection === "media") {
      const isVideo = form.type === "video";
      return (
        <FormField
          key={field}
          id={field}
          label={isVideo ? "Video" : "Full-size image"}
          error={errors.url}
          hint={
            isVideo
              ? "A YouTube link, any video page, or an uploaded video file."
              : "Paste an image URL or upload a file."
          }
          className="span-2"
        >
          <MediaInput
            id={field}
            value={form.url}
            accept={isVideo ? ["video"] : ["image"]}
            onChange={(value) => set(field, value)}
            onUploaded={(uploaded) => {
              if (form.imageUrl) return;
              // A screenshot reuses its picture; Cloudinary serves a video's
              // first frame as an image when the extension is swapped.
              set(
                "imageUrl",
                uploaded.resourceType === "video"
                  ? uploaded.url.replace(/\.[A-Za-z0-9]+$/, ".jpg")
                  : uploaded.url,
              );
            }}
          />
        </FormField>
      );
    }
    if (field === "type") {
      return (
        <FormField key={field} id={field} label="Media type" error={errors.type}>
          <select id={field} value={form.type} onChange={(event) => set(field, event.target.value)}>
            <option value="screenshot">Screenshot</option>
            <option value="video">Video</option>
          </select>
        </FormField>
      );
    }
    const isLong = ["coverUrl", "imageUrl", "url"].includes(field);
    const isOrder = field === "sortOrder";
    return (
      <FormField
        key={field}
        id={field}
        label={FIELD_LABELS[field]}
        error={errors[field]}
        className={isLong ? "span-2" : ""}
      >
        <input
          id={field}
          type={
            isOrder
              ? "number"
              : field.toLowerCase().includes("url") || field === "url"
                ? "url"
                : "text"
          }
          min={isOrder ? 0 : undefined}
          max={isOrder ? 10000 : undefined}
          step={isOrder ? 1 : undefined}
          value={form[field]}
          onChange={(event) => set(field, event.target.value)}
        />
      </FormField>
    );
  }

  return (
    <Modal
      title={`${item ? "Edit" : "New"} ${config.itemLabel}`}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="content-collection-form"
            className="primary-button"
            disabled={saving}
          >
            <Icon name="check" size={12} /> {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="content-collection-form" className="form-grid" onSubmit={submit} noValidate>
        {error && !Object.keys(errors).length ? (
          <Notice className="span-2">{error.message}</Notice>
        ) : null}
        {config.fields.map(renderField)}
      </form>
    </Modal>
  );
}

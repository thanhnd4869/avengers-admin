import { useState } from "react";

import FormField, { fieldErrors } from "@components/FormField";
import Icon from "@components/Icon";
import { ListState } from "@components/ListControls";
import Modal from "@components/Modal";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getPages, updatePage } from "@services/adminService";

export default function SitePagesPage() {
  const { data, error, loading, refresh } = useApi(getPages, "site-pages");
  const [editing, setEditing] = useState(null);
  const [busySlug, setBusySlug] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const pages = data?.data ?? [];

  async function togglePublished(page) {
    if (page.published && !window.confirm(`Take "${page.title}" offline?`)) return;
    setBusySlug(page.slug);
    setActionError("");
    try {
      await updatePage(page.slug, { published: !page.published });
      setNotice(page.published ? "Page hidden." : "Page published.");
      refresh();
    } catch (cause) {
      setActionError(cause.message || "Could not update the page.");
    } finally {
      setBusySlug("");
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CONTENT"
        title="Site pages"
        description="Edit FAQ and policy pages without a code release."
        actions={<RefreshButton disabled={loading} onClick={refresh} />}
      />
      <Notice tone="success" onClose={() => setNotice("")}>
        {notice}
      </Notice>
      <Notice onClose={() => setActionError("")}>{actionError}</Notice>
      <section className="panel">
        <ListState
          loading={loading}
          error={error}
          empty={pages.length === 0}
          emptyText="No editable site pages were found."
        />
        {!loading && pages.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th className="numeric">Sections</th>
                  <th>Published</th>
                  <th className="actions-col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.slug} className={page.published ? "" : "row-muted"}>
                    <td>
                      <strong>{page.title}</strong>
                      <span className="cell-sub">/{page.slug}</span>
                    </td>
                    <td className="numeric">{page.sections?.length ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className={`toggle ${page.published ? "on" : ""}`}
                        role="switch"
                        aria-checked={page.published}
                        aria-label={`${page.title} published`}
                        disabled={busySlug === page.slug}
                        onClick={() => togglePublished(page)}
                      >
                        <span />
                      </button>
                    </td>
                    <td className="actions-col">
                      <button
                        type="button"
                        className="icon-button"
                        title="Edit page"
                        onClick={() => setEditing(page)}
                      >
                        <Icon name="edit" size={12} />
                        <span className="visually-hidden">Edit page</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      {editing ? (
        <PageEditor
          page={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice("Page updated.");
            refresh();
          }}
        />
      ) : null}
    </>
  );
}

function PageEditor({ page, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: page.title,
    summary: page.summary ?? "",
    sections: page.sections?.map((section) => ({ ...section })) ?? [],
    published: page.published,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const errors = fieldErrors(error);

  function setSection(index, field, value) {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section,
      ),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updatePage(page.slug, form);
      onSaved();
    } catch (cause) {
      setError(cause);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Edit ${page.title}`}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="site-page-form" className="primary-button" disabled={saving}>
            <Icon name="check" size={12} /> {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="site-page-form" className="form-grid" onSubmit={submit} noValidate>
        {error && !Object.keys(errors).length ? (
          <Notice className="span-2">{error.message}</Notice>
        ) : null}
        <FormField id="page-title" label="Title" error={errors.title} className="span-2">
          <input
            id="page-title"
            value={form.title}
            maxLength={160}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </FormField>
        <FormField id="page-summary" label="Summary" error={errors.summary} className="span-2">
          <textarea
            id="page-summary"
            rows={2}
            maxLength={500}
            value={form.summary}
            onChange={(event) =>
              setForm((current) => ({ ...current, summary: event.target.value }))
            }
          />
        </FormField>
        <div className="form-field span-2">
          <div className="panel-heading">
            <div>
              <span className="field-label">Sections</span>
              <div className="field-hint">
                Keep each section as plain text; separate paragraphs with a blank line.
              </div>
            </div>
            <button
              type="button"
              className="secondary-button"
              disabled={form.sections.length >= 100}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  sections: [...current.sections, { heading: "", body: "" }],
                }))
              }
            >
              <Icon name="add" size={11} /> Add section
            </button>
          </div>
          {errors.sections ? <div className="field-error">{errors.sections}</div> : null}
          {form.sections.map((section, index) => (
            <div className="panel section-editor" key={`${page.slug}-${index}`}>
              <div className="panel-heading">
                <strong>Section {index + 1}</strong>
                <button
                  type="button"
                  className="icon-button danger"
                  title="Remove section"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      sections: current.sections.filter(
                        (_, sectionIndex) => sectionIndex !== index,
                      ),
                    }))
                  }
                >
                  <Icon name="delete" size={12} />
                  <span className="visually-hidden">Remove section</span>
                </button>
              </div>
              <FormField id={`section-heading-${index}`} label="Heading">
                <input
                  id={`section-heading-${index}`}
                  maxLength={160}
                  value={section.heading}
                  onChange={(event) => setSection(index, "heading", event.target.value)}
                />
              </FormField>
              <FormField id={`section-body-${index}`} label="Body">
                <textarea
                  id={`section-body-${index}`}
                  rows={5}
                  maxLength={10000}
                  value={section.body}
                  onChange={(event) => setSection(index, "body", event.target.value)}
                />
              </FormField>
            </div>
          ))}
        </div>
        <div className="form-field span-2">
          <span className="field-label">Visibility</span>
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) =>
                setForm((current) => ({ ...current, published: event.target.checked }))
              }
            />
            Publish this page in the shop
          </label>
        </div>
      </form>
    </Modal>
  );
}

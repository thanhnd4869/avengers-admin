import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import FormField, { fieldErrors } from "@components/FormField";
import Icon from "@components/Icon";
import { ListState } from "@components/ListControls";
import MediaInput from "@components/MediaInput";
import { ArrowLink, BackLink, Notice, PageHeading, PanelHeading } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import {
  createPost,
  deletePost,
  getPost,
  getPostCategories,
  updatePost,
} from "@services/adminService";
import { formatNumber, slugify } from "@utils/format";

function toForm(post, categories) {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    imageUrl: post?.image?.url ?? "",
    categoryId: post?.categoryId ?? categories[0]?.id ?? "",
    publishedAt: (post?.publishedAt ?? new Date().toISOString()).slice(0, 10),
  };
}

/** Loads the post once, then hands it to the editor as its starting state. */
export default function PostEditPage() {
  const { id } = useParams();
  const isNew = id === "new";
  const categories = useApi(getPostCategories, "post-categories");
  const post = useApi(() => (isNew ? Promise.resolve({ data: null }) : getPost(id)), id);

  if (categories.loading || post.loading || categories.error || post.error) {
    return (
      <>
        <BackLink to="/posts">All posts</BackLink>
        <ListState
          loading={categories.loading || post.loading}
          error={categories.error || post.error}
        />
      </>
    );
  }

  return <PostEditor key={id} initial={post.data.data} categories={categories.data.data} />;
}

function PostEditor({ initial, categories }) {
  const navigate = useNavigate();
  const [post, setPost] = useState(initial);
  const [form, setForm] = useState(() => toForm(initial, categories));
  // A new post's slug follows its title until the slug is edited by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const errors = fieldErrors(error);

  function set(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice("");
    const body = { ...form };
    // An unchanged date is left alone, so a post's original time is kept.
    if (post && body.publishedAt === post.publishedAt?.slice(0, 10)) delete body.publishedAt;
    try {
      if (post) {
        const { data } = await updatePost(post.id, body);
        setPost(data);
        setForm(toForm(data, categories));
        setNotice("Changes saved.");
      } else {
        const { data } = await createPost(body);
        navigate(`/posts/${data.id}`, { replace: true });
      }
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished() {
    if (post.published && !window.confirm(`Hide "${post.title}" from the blog?`)) return;
    setError(null);
    try {
      const { data } = await updatePost(post.id, { published: !post.published });
      setPost(data);
      setNotice(data.published ? "The post is live on the blog." : "The post is hidden.");
    } catch (cause) {
      setError(cause);
    }
  }

  async function remove() {
    const comments = post.commentCount
      ? ` and its ${post.commentCount} comment${post.commentCount === 1 ? "" : "s"}`
      : "";
    if (!window.confirm(`Delete "${post.title}"${comments}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deletePost(post.id);
      navigate("/posts", { replace: true });
    } catch (cause) {
      setError(cause);
    }
  }

  return (
    <>
      <BackLink to="/posts">All posts</BackLink>
      <PageHeading
        eyebrow="BLOG"
        title={post ? post.title : "New post"}
        description={
          post ? `/${post.slug}` : "New posts start hidden. Write it, then publish when ready."
        }
        actions={
          post ? (
            <>
              <button type="button" className="secondary-button" onClick={remove}>
                <Icon name="delete" size={12} /> Delete
              </button>
              <button
                type="button"
                className={post.published ? "secondary-button" : "primary-button"}
                onClick={togglePublished}
              >
                <Icon name={post.published ? "hidden" : "visible"} size={12} />
                {post.published ? "Hide from blog" : "Publish"}
              </button>
            </>
          ) : null
        }
      />

      <Notice tone="success" onClose={() => setNotice("")}>
        {notice}
      </Notice>
      <Notice onClose={() => setError(null)}>{error?.message}</Notice>
      {categories.length === 0 ? (
        <Notice tone="warning">There are no blog categories yet, so a post cannot be saved.</Notice>
      ) : null}

      <form className="panel form-panel" onSubmit={save} noValidate>
        <PanelHeading eyebrow="ARTICLE" title="Post">
          {post ? (
            <ArrowLink to={`/comments?postId=${post.id}`}>
              {formatNumber(post.commentCount)} comments
            </ArrowLink>
          ) : null}
        </PanelHeading>
        <div className="form-grid">
          <FormField id="title" label="Title" error={errors.title} className="span-2">
            <input
              id="title"
              value={form.title}
              maxLength={160}
              onChange={(event) => set("title", event.target.value)}
            />
          </FormField>
          <FormField id="slug" label="URL slug" error={errors.slug} hint="Used in the blog URL.">
            <input
              id="slug"
              value={form.slug}
              maxLength={120}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", event.target.value);
              }}
            />
          </FormField>
          <FormField id="categoryId" label="Category" error={errors.categoryId}>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(event) => set("categoryId", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            id="imageUrl"
            label="Cover image"
            error={errors.imageUrl}
            hint="Paste an image URL or upload a file."
            className="span-2"
          >
            <MediaInput
              id="imageUrl"
              value={form.imageUrl}
              placeholderIcon="posts"
              onChange={(value) => set("imageUrl", value)}
            />
          </FormField>
          <FormField
            id="publishedAt"
            label="Date"
            error={errors.publishedAt}
            hint="Posts are listed newest first by this date."
          >
            <input
              id="publishedAt"
              type="date"
              value={form.publishedAt}
              onChange={(event) => set("publishedAt", event.target.value)}
            />
          </FormField>
          <FormField
            id="excerpt"
            label="Excerpt"
            error={errors.excerpt}
            hint="Shown on post cards and above the article. Up to 400 characters."
            className="span-2"
          >
            <textarea
              id="excerpt"
              rows={3}
              maxLength={400}
              value={form.excerpt}
              onChange={(event) => set("excerpt", event.target.value)}
            />
          </FormField>
          <FormField
            id="content"
            label="Article"
            error={errors.content}
            hint='Plain text. Leave a blank line between paragraphs; start a paragraph with "### " for a subheading.'
            className="span-2"
          >
            <textarea
              id="content"
              rows={16}
              maxLength={50000}
              value={form.content}
              onChange={(event) => set("content", event.target.value)}
            />
          </FormField>
        </div>
        <div className="form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={saving || categories.length === 0}
          >
            <Icon name="check" size={12} />
            {saving ? "Saving…" : post ? "Save changes" : "Create post"}
          </button>
        </div>
      </form>
    </>
  );
}

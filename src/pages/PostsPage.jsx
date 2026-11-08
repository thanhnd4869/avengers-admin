import { useState } from "react";
import { Link } from "react-router";

import Icon from "@components/Icon";
import { FilterTabs, ListState, Pagination, SearchBox } from "@components/ListControls";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { getPostCategories, getPosts, updatePost } from "@services/adminService";
import { formatDate, formatNumber } from "@utils/format";

const FILTERS = [
  { value: "", label: "All posts" },
  { value: "true", label: "Published" },
  { value: "false", label: "Hidden" },
];

export default function PostsPage() {
  const [published, setPublished] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const categories = useApi(getPostCategories, "post-categories");
  const { data, error, loading, refresh } = useApi(
    () => getPosts({ page, published, categoryId, q: search }),
    `${page}|${published}|${categoryId}|${search}`,
  );
  const posts = (data?.data ?? []).map((post) => overrides[post.id] ?? post);
  const categoryNames = new Map(
    (categories.data?.data ?? []).map((category) => [category.id, category.name]),
  );

  async function togglePublished(post) {
    const next = !post.published;
    if (!next && !window.confirm(`Hide "${post.title}" from the blog?`)) return;

    setSavingId(post.id);
    setActionError("");
    try {
      const { data: updated } = await updatePost(post.id, { published: next });
      setOverrides((current) => ({ ...current, [updated.id]: updated }));
    } catch (cause) {
      setActionError(cause.message || "Could not update the post.");
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
        eyebrow="CONTENT"
        title="Blog posts"
        description="News and articles on the shop's blog. Hide a post to take it offline."
        actions={
          <>
            <RefreshButton
              disabled={loading}
              onClick={() => {
                setOverrides({});
                refresh();
              }}
            />
            <Link className="primary-button" to="/posts/new">
              <Icon name="add" size={12} /> New post
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
            label="Filter posts"
            onChange={(value) => changeFilter(() => setPublished(value))}
          />
          <div className="toolbar-group">
            <select
              className="status-select"
              aria-label="Category"
              value={categoryId}
              onChange={(event) => changeFilter(() => setCategoryId(event.target.value))}
            >
              <option value="">All categories</option>
              {(categories.data?.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <SearchBox
              value={search}
              placeholder="Title or slug"
              onChange={(value) => changeFilter(() => setSearch(value))}
            />
          </div>
        </div>
        <ListState
          loading={loading}
          error={error}
          empty={posts.length === 0}
          emptyText="No posts match."
        />
        {!loading && posts.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="numeric">Comments</th>
                  <th>Blog</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className={post.published ? "" : "row-muted"}>
                    <td>
                      <Link className="product-cell row-link" to={`/posts/${post.id}`}>
                        <img src={post.image?.url} alt="" loading="lazy" />
                        <span>
                          {post.title}
                          <span className="cell-sub">{post.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="text-nowrap">{categoryNames.get(post.categoryId) ?? "—"}</td>
                    <td className="muted text-nowrap">{formatDate(post.publishedAt)}</td>
                    <td className="numeric">
                      {post.commentCount > 0 ? (
                        <Link className="row-link" to={`/comments?postId=${post.id}`}>
                          {formatNumber(post.commentCount)}
                        </Link>
                      ) : (
                        <span className="muted">0</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`toggle ${post.published ? "on" : ""}`}
                        role="switch"
                        aria-checked={post.published}
                        aria-label={`${post.title} visible on the blog`}
                        disabled={savingId === post.id}
                        onClick={() => togglePublished(post)}
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

import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import Icon from "@components/Icon";
import { ListState, Pagination, SearchBox } from "@components/ListControls";
import { Notice, PageHeading, RefreshButton } from "@components/PageParts";
import { useApi } from "@hooks/useApi";
import { deleteComment, getComments, getPost } from "@services/adminService";
import { formatDateTime, formatNumber } from "@utils/format";

export default function CommentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const postId = searchParams.get("postId") ?? "";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const { data, error, loading, refresh } = useApi(
    () => getComments({ page, postId, q: search }),
    `${page}|${postId}|${search}`,
  );
  const post = useApi(
    () => (postId ? getPost(postId) : Promise.resolve({ data: null })),
    `post:${postId}`,
  );
  const comments = data?.data ?? [];

  async function remove(comment) {
    if (!window.confirm(`Remove this comment by ${comment.authorName || "a reader"}?`)) return;

    setBusyId(comment.id);
    setActionError("");
    setNotice("");
    try {
      await deleteComment(comment.id);
      setNotice(
        comment.isReply
          ? "Comment removed."
          : "Comment removed. If it had replies, it stays as a deleted placeholder.",
      );
      refresh();
    } catch (cause) {
      setActionError(cause.message || "Could not remove the comment.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CONTENT"
        title="Comments"
        description="What readers write under blog posts, newest first. Remove what breaks the rules."
        actions={<RefreshButton disabled={loading} onClick={refresh} />}
      />
      <Notice tone="success" onClose={() => setNotice("")}>
        {notice}
      </Notice>
      <Notice onClose={() => setActionError("")}>{actionError}</Notice>
      <section className="panel">
        <div className="inbox-toolbar">
          {postId ? (
            <span className="chip selected">
              <Icon name="posts" size={10} />
              {post.data?.data?.title ?? "One post"}
              <button
                type="button"
                className="chip-clear"
                title="Show every post"
                onClick={() => {
                  setSearchParams({});
                  setPage(1);
                }}
              >
                <Icon name="close" size={9} />
                <span className="visually-hidden">Show every post</span>
              </button>
            </span>
          ) : (
            <span className="result-count">
              {data?.meta ? `${formatNumber(data.meta.total)} comments` : ""}
            </span>
          )}
          <SearchBox
            value={search}
            placeholder="Text or author"
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </div>
        <ListState
          loading={loading}
          error={error}
          empty={comments.length === 0}
          emptyText="No comments match."
        />
        {!loading && comments.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Comment</th>
                  <th>Author</th>
                  <th>Post</th>
                  <th>Written</th>
                  <th className="actions-col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id}>
                    <td>
                      <div className="comment-body">{comment.body}</div>
                      <span className="cell-sub">
                        {comment.isReply ? "Reply" : "Comment"}
                        {comment.edited ? " · edited" : ""}
                      </span>
                    </td>
                    <td className="text-nowrap">
                      {comment.userId ? (
                        <Link className="row-link" to={`/users/${comment.userId}`}>
                          {comment.authorName}
                        </Link>
                      ) : (
                        comment.authorName
                      )}
                    </td>
                    <td>
                      {comment.post ? (
                        <Link className="row-link" to={`/posts/${comment.post.id}`}>
                          {comment.post.title}
                        </Link>
                      ) : (
                        <span className="muted">Deleted post</span>
                      )}
                    </td>
                    <td className="muted text-nowrap">{formatDateTime(comment.createdAt)}</td>
                    <td className="actions-col">
                      <button
                        type="button"
                        className="secondary-button compact"
                        disabled={busyId === comment.id}
                        onClick={() => remove(comment)}
                      >
                        <Icon name="delete" size={11} /> Remove
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

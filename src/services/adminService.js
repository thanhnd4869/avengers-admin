import { apiClient } from "./apiClient";

// Leaves out empty filters so the API applies its own defaults.
function params(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export function getOverview(days = 30) {
  return apiClient.get("/admin/overview", { params: { days } });
}

export function getOrders({ page = 1, limit = 20, status, q } = {}) {
  return apiClient.get("/admin/orders", { params: params({ page, limit, status, q }) });
}

export function getOrder(number) {
  return apiClient.get(`/admin/orders/${encodeURIComponent(number)}`);
}

export function getPayments({ page = 1, limit = 20, status } = {}) {
  return apiClient.get("/admin/payments", { params: params({ page, limit, status }) });
}

export function markPaymentRefunded(id, note) {
  return apiClient.post(`/admin/payments/${encodeURIComponent(id)}/refund`, { note });
}

export function getUsers({ page = 1, limit = 20, role, q } = {}) {
  return apiClient.get("/admin/users", { params: params({ page, limit, role, q }) });
}

export function getUser(id) {
  return apiClient.get(`/admin/users/${encodeURIComponent(id)}`);
}

export function getProducts({ page = 1, limit = 20, published, q } = {}) {
  return apiClient.get("/admin/products", { params: params({ page, limit, published, q }) });
}

export function getProduct(id) {
  return apiClient.get(`/admin/products/${encodeURIComponent(id)}`);
}

export function createProduct(product) {
  return apiClient.post("/admin/products", product);
}

export function updateProduct(id, changes) {
  return apiClient.patch(`/admin/products/${encodeURIComponent(id)}`, changes);
}

export function setProductPublished(id, published) {
  return updateProduct(id, { published });
}

function variantPath(productId, variantId = "") {
  return `/admin/products/${encodeURIComponent(productId)}/variants${
    variantId ? `/${encodeURIComponent(variantId)}` : ""
  }`;
}

export function createVariant(productId, variant) {
  return apiClient.post(variantPath(productId), variant);
}

export function updateVariant(productId, variantId, changes) {
  return apiClient.patch(variantPath(productId, variantId), changes);
}

export function deleteVariant(productId, variantId) {
  return apiClient.delete(variantPath(productId, variantId));
}

export function addKeys(productId, variantId, codes) {
  return apiClient.post(`${variantPath(productId, variantId)}/keys`, { codes });
}

export function getPlatforms() {
  return apiClient.get("/admin/platforms");
}

export function getProductCategories() {
  return apiClient.get("/admin/product-categories");
}

export function getContactMessages({ page = 1, limit = 20, status } = {}) {
  return apiClient.get("/admin/contact-messages", {
    params: { page, limit, ...(status ? { status } : {}) },
  });
}

export function updateContactMessageStatus(id, status) {
  return apiClient.patch(`/admin/contact-messages/${encodeURIComponent(id)}`, { status });
}

export function getBanners() {
  return apiClient.get("/admin/banners");
}

export function createBanner(banner) {
  return apiClient.post("/admin/banners", banner);
}

export function updateBanner(id, changes) {
  return apiClient.patch(`/admin/banners/${encodeURIComponent(id)}`, changes);
}

export function deleteBanner(id) {
  return apiClient.delete(`/admin/banners/${encodeURIComponent(id)}`);
}

export function getPostCategories() {
  return apiClient.get("/admin/post-categories");
}

export function getPosts({ page = 1, limit = 20, published, categoryId, q } = {}) {
  return apiClient.get("/admin/posts", {
    params: params({ page, limit, published, categoryId, q }),
  });
}

export function getPost(id) {
  return apiClient.get(`/admin/posts/${encodeURIComponent(id)}`);
}

export function createPost(post) {
  return apiClient.post("/admin/posts", post);
}

export function updatePost(id, changes) {
  return apiClient.patch(`/admin/posts/${encodeURIComponent(id)}`, changes);
}

export function deletePost(id) {
  return apiClient.delete(`/admin/posts/${encodeURIComponent(id)}`);
}

export function getComments({ page = 1, limit = 20, postId, q } = {}) {
  return apiClient.get("/admin/comments", { params: params({ page, limit, postId, q }) });
}

export function deleteComment(id) {
  return apiClient.delete(`/admin/comments/${encodeURIComponent(id)}`);
}

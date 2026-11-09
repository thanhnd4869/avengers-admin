import { createUploadSignature, getUploadConfig } from "./adminService";

const MAX_BYTES = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024 };

let enabled = null;

/** Whether the API has Cloudinary set up; asked once per page load. */
export function uploadsEnabled() {
  if (!enabled) {
    enabled = getUploadConfig()
      .then((response) => Boolean(response.data?.enabled))
      .catch(() => {
        enabled = null;
        return false;
      });
  }
  return enabled;
}

export function resourceTypeOf(file) {
  return file.type.startsWith("video/") ? "video" : "image";
}

/**
 * Sends a file straight to Cloudinary with a signature from the API, so the
 * file never passes through the API and the secret never reaches the browser.
 * Answers the HTTPS delivery URL to store.
 */
export async function uploadFile(file, { onProgress } = {}) {
  const resourceType = resourceTypeOf(file);

  if (!file.type.startsWith(`${resourceType}/`)) {
    throw new Error("Choose an image or a video file.");
  }
  if (file.size > MAX_BYTES[resourceType]) {
    throw new Error(
      `${resourceType === "video" ? "Videos" : "Images"} can be at most ${MAX_BYTES[resourceType] / 1024 / 1024} MB.`,
    );
  }

  const { data: signed } = await createUploadSignature(resourceType);
  const form = new FormData();

  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("signature", signed.signature);
  for (const [name, value] of Object.entries(signed.params)) form.append(name, value);

  // XMLHttpRequest rather than fetch, for upload progress on large videos.
  const result = await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("POST", signed.uploadUrl);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    });
    request.addEventListener("load", () => {
      let body = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        // Handled below as a failed upload.
      }
      if (request.status >= 200 && request.status < 300 && body?.secure_url) resolve(body);
      else reject(new Error(body?.error?.message ?? "The upload failed."));
    });
    request.addEventListener("error", () => reject(new Error("Unable to reach Cloudinary.")));
    request.send(form);
  });

  return { url: result.secure_url, resourceType };
}

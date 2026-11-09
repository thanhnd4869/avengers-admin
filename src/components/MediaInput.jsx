import { useEffect, useId, useRef, useState } from "react";

import Icon from "@components/Icon";
import { uploadFile, uploadsEnabled } from "@services/uploadService";

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/avif",
  video: "video/mp4,video/webm,video/quicktime",
};
const VIDEO_URL = /\.(mp4|webm|mov)(?:[?#].*)?$/i;

/** Whether the uploads button can be shown; `null` until the API answers. */
export function useUploadsEnabled() {
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    let cancelled = false;
    uploadsEnabled().then((value) => {
      if (!cancelled) setEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}

/**
 * Upload button that sends the chosen file to Cloudinary and hands back its
 * URL. Hidden while the API has no Cloudinary credentials.
 */
export function UploadButton({
  accept = ["image"],
  onUploaded,
  onError,
  label = "Upload",
  multiple,
}) {
  const enabled = useUploadsEnabled();
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);

  if (!enabled) return null;

  async function upload(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (!files.length) return;

    onError?.("");
    try {
      for (const [index, file] of files.entries()) {
        const uploaded = await uploadFile(file, {
          onProgress: (share) => setProgress((index + share) / files.length),
        });
        onUploaded(uploaded, file);
      }
    } catch (cause) {
      onError?.(cause.message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={accept.map((type) => ACCEPT[type]).join(",")}
        onChange={upload}
      />
      <button
        type="button"
        className="secondary-button compact"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
      >
        <Icon name="upload" size={11} />{" "}
        {progress === null ? label : `Uploading ${Math.round(progress * 100)}%`}
      </button>
    </>
  );
}

/**
 * A URL field for an image or video: paste a link from anywhere, or upload a
 * file to Cloudinary, which fills the link in.
 */
export default function MediaInput({
  id,
  value,
  onChange,
  accept = ["image"],
  placeholderIcon = "banners",
  required,
  placeholder = "https://…",
  onUploaded,
}) {
  const [error, setError] = useState("");
  const errorId = useId();
  const isVideo = VIDEO_URL.test(value);

  return (
    <>
      <div className="image-input">
        {value && isVideo ? (
          <video src={value} muted preload="metadata" />
        ) : value ? (
          <img src={value} alt="" />
        ) : (
          <span className="image-placeholder">
            <Icon name={placeholderIcon} size={16} />
          </span>
        )}
        <input
          id={id}
          type="url"
          value={value}
          maxLength={2000}
          required={required}
          placeholder={placeholder}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <UploadButton
          accept={accept}
          onError={setError}
          onUploaded={(uploaded) => {
            onChange(uploaded.url);
            onUploaded?.(uploaded);
          }}
        />
      </div>
      {error ? (
        <div className="field-error" id={errorId}>
          {error}
        </div>
      ) : null}
    </>
  );
}

import { useEffect, useRef } from "react";

import Icon from "@components/Icon";

/**
 * A dialog built on the native `<dialog>`, so focus is trapped and Escape
 * closes it without extra code. Rendered only while open.
 */
export default function Modal({ title, onClose, children, footer, size = "md" }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${size}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} title="Close">
          <Icon name="close" size={14} />
          <span className="visually-hidden">Close</span>
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      {footer ? <div className="dialog-foot">{footer}</div> : null}
    </dialog>
  );
}

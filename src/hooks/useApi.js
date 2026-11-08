import { useCallback, useEffect, useState } from "react";

/**
 * Loads `load()` whenever `key` changes. The result is tagged with the key it
 * belongs to, so a slow answer for an old filter never replaces a newer one
 * and `loading` is derived instead of set from inside the effect.
 */
export function useApi(load, key) {
  const [reload, setReload] = useState(0);
  const [state, setState] = useState(null);
  const requestKey = `${key}#${reload}`;

  useEffect(() => {
    let cancelled = false;

    load()
      .then((response) => {
        if (!cancelled) setState({ key: requestKey, response, error: "" });
      })
      .catch((cause) => {
        if (!cancelled) {
          setState({
            key: requestKey,
            response: null,
            error: cause.message || "Could not load data.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // `load` is recreated every render; `requestKey` captures what it reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const current = state?.key === requestKey ? state : null;
  const refresh = useCallback(() => setReload((count) => count + 1), []);

  return {
    data: current?.response ?? null,
    error: current?.error ?? "",
    loading: !current,
    refresh,
  };
}

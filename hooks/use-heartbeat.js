import { useEffect } from "react";

const HEARTBEAT_INTERVAL = 60 * 1000; // 60 seconds

/**
 * Pings heartbeatUrl via POST every 60 seconds to keep the server-side
 * last_active timestamp fresh. Fires an immediate ping on mount so the
 * cookie is set before the first interval elapses.
 *
 * @param {string} heartbeatUrl  Full path to the heartbeat POST endpoint.
 */
export function useHeartbeat(heartbeatUrl) {
  useEffect(() => {
    function ping() {
      fetch(heartbeatUrl, { method: "POST" }).catch(() => {});
    }

    ping(); // immediate ping on mount

    const id = setInterval(ping, HEARTBEAT_INTERVAL);

    return () => clearInterval(id);
  }, [heartbeatUrl]);
}

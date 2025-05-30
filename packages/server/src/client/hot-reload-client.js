// Hot Reload Client Script for Rune UI
(function () {
  "use strict";

  console.log("🔥 Hot Reload Client initializing...");

  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const reconnectInterval = 1000;
  let isConnected = false;

  function connect() {
    try {
      ws = new WebSocket("ws://localhost:%%HOT_RELOAD_PORT%%");

      ws.onopen = function () {
        console.log("🔥 Hot reload connected");
        reconnectAttempts = 0;
        isConnected = true;
        hideConnectionError();
      };

      ws.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error("Hot reload message error:", error);
        }
      };

      ws.onclose = function () {
        isConnected = false;
        console.log("🔌 Hot reload disconnected");

        if (reconnectAttempts < maxReconnectAttempts) {
          showConnectionError();
          setTimeout(function () {
            reconnectAttempts++;
            console.log(
              "🔄 Reconnecting... (" +
                reconnectAttempts +
                "/" +
                maxReconnectAttempts +
                ")",
            );
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = function (error) {
        console.error("Hot reload error:", error);
        isConnected = false;
      };
    } catch (error) {
      console.error("Failed to connect to hot reload server:", error);
      showConnectionError("Hot reload server unavailable");
    }
  }

  function handleMessage(message) {
    console.log("🔥 Hot reload message:", message);

    switch (message.type) {
      case "connected":
        console.log("🔌 Hot reload established");
        break;

      case "reload":
        console.log("🔄 Reloading page: " + message.reason);
        showNotification("🔄 " + (message.reason || "Page reloading..."));
        reloadRunePage(message.reason);
        break;

      case "css-reload":
        console.log("🎨 Reloading CSS");
        reloadCSS();
        showNotification("🎨 CSS reloaded");
        break;

      case "error":
        console.error("Hot reload error:", message.message);
        showNotification("❌ " + message.message, "error");
        break;
    }
  }

  function reloadRunePage(reason) {
    try {
      fetch(window.location.href, {
        headers: {
          Accept: "text/html",
          "X-Hot-Reload": "true",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch updated page");
          }
          return response.text();
        })
        .then((html) => {
          const parser = new DOMParser();
          const newDoc = parser.parseFromString(html, "text/html");
          const newDataScript = newDoc.querySelector("script");
          let newRuneData = {};
          if (
            newDataScript &&
            newDataScript.textContent.includes("__RUNE_DATA__")
          ) {
            const match = newDataScript.textContent.match(
              /window\.__RUNE_DATA__\s*=\s*({[^;]+});/,
            );
            if (match) {
              try {
                newRuneData = JSON.parse(match[1]);
              } catch (e) {
                console.warn("Failed to parse new Rune data:", e);
              }
            }
          }
          const newContent = newDoc.querySelector("#__rune_root__");
          if (!newContent) {
            throw new Error("New content not found");
          }
          const currentContent = document.querySelector("#__rune_root__");
          if (currentContent) {
            window.__RUNE_DATA__ = newRuneData;
            currentContent.innerHTML = newContent.innerHTML;
            triggerRuneRedraw();
            if (newDoc.title !== document.title) {
              document.title = newDoc.title;
            }
            console.log("✅ Page reloaded successfully");
            showNotification("✅ Page updated", "success");
          }
        })
        .catch((error) => {
          console.error("Page reload failed:", error);
          window.location.reload();
        });
    } catch (error) {
      console.error("Rune page reload error:", error);
      window.location.reload();
    }
  }

  function triggerRuneRedraw() {
    try {
      console.log("🎯 Triggering Rune redraw...");

      // 1. RunePage 다시 하이드레이션
      if (window.__RUNE__ && window.__RUNE__.hydrator) {
        console.log("🎯 Re-hydrating RunePage...");
        window.__RUNE__.hydrator.hydrateRunePage();
      }

      // 2. 전역 Rune redraw 시도
      if (window.Rune && typeof window.Rune.redraw === "function") {
        console.log("🎯 Triggering global Rune redraw");
        window.Rune.redraw();
        return;
      }

      // 3. 개별 Rune View 다시 그리기
      const runeElements = document.querySelectorAll("[data-rune]");
      runeElements.forEach((element) => {
        const viewInstance = element.__runeView;
        if (viewInstance && typeof viewInstance.redraw === "function") {
          console.log("🎯 Redrawing Rune view:", viewInstance.constructor.name);
          viewInstance.redraw();
        }
      });

      // 4. 전역 redraw 함수 시도
      if (typeof window.redraw === "function") {
        console.log("🎯 Calling global redraw function");
        window.redraw();
      }

      // 5. 커스텀 이벤트 발생
      window.dispatchEvent(
        new CustomEvent("rune:hot-reload", {
          detail: {
            reason: "file-changed",
            data: window.__RUNE_DATA__,
          },
        }),
      );

      console.log("🎯 Rune redraw completed");
    } catch (error) {
      console.error("Rune redraw failed:", error);
      window.location.reload();
    }
  }

  function reloadCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(function (link) {
      const href = link.href;
      const url = new URL(href);
      url.searchParams.set("_reload", Date.now().toString());
      link.href = url.toString();
    });
  }

  function showNotification(message, type) {
    type = type || "info";
    const notification = document.createElement("div");
    notification.style.cssText =
      "position: fixed; top: 20px; right: 20px; " +
      "background: " +
      (type === "error"
        ? "#f44336"
        : type === "success"
          ? "#4CAF50"
          : "#2196F3") +
      "; " +
      "color: white; padding: 12px 16px; border-radius: 6px; " +
      "z-index: 10000; font-family: system-ui, sans-serif; " +
      "font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); " +
      "max-width: 300px; word-wrap: break-word; " +
      "transition: all 0.3s ease; opacity: 0; transform: translateY(-10px);";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(function () {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 10);
    setTimeout(
      function () {
        if (notification.parentNode) {
          notification.style.opacity = "0";
          notification.style.transform = "translateY(-10px)";
          setTimeout(function () {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      },
      type === "error" ? 5000 : 3000,
    );
  }

  function showConnectionError(message) {
    message = message || "Hot reload disconnected";
    const existing = document.getElementById("hot-reload-error");
    if (existing) {
      existing.remove();
    }
    const errorDiv = document.createElement("div");
    errorDiv.id = "hot-reload-error";
    errorDiv.style.cssText =
      "position: fixed; top: 0; left: 0; right: 0; " +
      "background: #ff9800; color: white; padding: 8px; " +
      "text-align: center; z-index: 10001; " +
      "font-family: system-ui, sans-serif; font-size: 13px; " +
      "box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
    errorDiv.textContent =
      "⚠️ " + message + " - Hot reload temporarily unavailable";
    document.body.appendChild(errorDiv);
  }

  function hideConnectionError() {
    const errorDiv = document.getElementById("hot-reload-error");
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connect);
  } else {
    connect();
  }

  window.__HOT_RELOAD__ = {
    isConnected: function () {
      return isConnected;
    },
    reconnect: connect,
    disconnect: function () {
      if (ws) {
        ws.close();
      }
    },
    triggerRedraw: triggerRuneRedraw,
  };
})();

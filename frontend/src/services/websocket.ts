import { useAuthStore } from '../stores/auth';

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let tabId: string | null = null;

// Get or create unique tab ID
function getTabId(): string {
  if (!tabId) {
    tabId = localStorage.getItem('wsTabId');
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('wsTabId', tabId);
    }
  }
  return tabId;
}

// Clear tabId on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Don't clear tabId - we want to reuse it on refresh
  });
}

export function connectWebSocket() {
  const { token, user, kickedMessage } = useAuthStore.getState();

  console.log('connectWebSocket called', { token: !!token, user, kickedMessage });

  if (!token || !user || kickedMessage) {
    console.log('WebSocket not connecting: missing token/user or kickedMessage');
    return;
  }

  // Close existing socket before creating new one
  if (socket) {
    console.log('Closing existing socket');
    socket.close();
    socket = null;
  }

  const currentTabId = getTabId();
  const wsUrl = `ws://localhost:8080/ws/kick?userId=${user.id}&tabId=${currentTabId}`;
  console.log('Connecting to WebSocket:', wsUrl, 'tabId:', currentTabId);

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connected successfully');
  };

  socket.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
    if (event.data === 'KICKED') {
      console.log('Received KICKED message');
      useAuthStore.getState().setKickedMessage('当前账号已在其他地方登录');
      setTimeout(() => {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }, 3000);
    }
  };

  socket.onclose = (event) => {
    console.log('WebSocket closed', event.code, event.reason);
    socket = null;
    // Auto reconnect after 5 seconds if still logged in
    const state = useAuthStore.getState();
    if (state.token && !state.kickedMessage) {
      reconnectTimer = window.setTimeout(() => {
        connectWebSocket();
      }, 5000);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error', error);
  };
}

export function disconnectWebSocket() {
  console.log('disconnectWebSocket called');
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
}
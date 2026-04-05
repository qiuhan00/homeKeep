package com.homekeep.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class KickNotificationHandler extends TextWebSocketHandler {

    // Session info to track both session and tabId
    private static class SessionInfo {
        final WebSocketSession session;
        final String tabId;
        SessionInfo(WebSocketSession session, String tabId) {
            this.session = session;
            this.tabId = tabId;
        }
    }

    // Map userId -> current active session info
    private final Map<Long, SessionInfo> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connection established, session id: {}", session.getId());
        Long userId = getUserIdFromSession(session);
        String tabId = getTabIdFromSession(session);
        log.info("Extracted userId: {}, tabId: {}", userId, tabId);
        if (userId != null) {
            SessionInfo oldInfo = userSessions.get(userId);
            if (oldInfo != null && oldInfo.session.isOpen()) {
                // If same tabId, it's a page refresh / same tab reconnection - don't kick
                if (oldInfo.tabId != null && oldInfo.tabId.equals(tabId)) {
                    log.info("Same tab reconnect for user {} (tabId: {}), closing old session", userId, tabId);
                    try {
                        oldInfo.session.close(CloseStatus.NORMAL);
                    } catch (IOException e) {
                        log.error("Error closing old session", e);
                    }
                } else {
                    // Different tab - this is 异地登录, kick the old one
                    try {
                        log.info("Kicking异地登录 session for user {} (old tabId: {}, new tabId: {})", userId, oldInfo.tabId, tabId);
                        oldInfo.session.sendMessage(new TextMessage("KICKED"));
                        oldInfo.session.close(CloseStatus.NORMAL);
                    } catch (IOException e) {
                        log.error("Error kicking old session", e);
                    }
                }
            }
            userSessions.put(userId, new SessionInfo(session, tabId));
            log.info("WebSocket connected for user: {}, total sessions: {}", userId, userSessions.size());
        } else {
            log.warn("No userId found in WebSocket session, closing");
            session.close(CloseStatus.NORMAL);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Client can send ping/pong or other messages
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = getUserIdFromSession(session);
        if (userId != null) {
            SessionInfo info = userSessions.get(userId);
            if (info != null && info.session == session) {
                userSessions.remove(userId);
            }
            log.info("WebSocket disconnected for user: {}", userId);
        }
    }

    public void kickUser(Long userId) {
        log.info("kickUser called for userId: {}", userId);
        SessionInfo info = userSessions.get(userId);
        if (info != null && info.session.isOpen()) {
            try {
                log.info("Sending KICKED message to user {}", userId);
                info.session.sendMessage(new TextMessage("KICKED"));
                info.session.close(CloseStatus.NORMAL);
            } catch (IOException e) {
                log.error("Error kicking user {}", userId, e);
            }
        } else {
            log.info("No active session found for user {}", userId);
        }
        userSessions.remove(userId);
    }

    private Long getUserIdFromSession(WebSocketSession session) {
        try {
            String query = session.getUri().getQuery();
            log.info("WebSocket query: {}", query);
            if (query != null) {
                for (String param : query.split("&")) {
                    if (param.startsWith("userId=")) {
                        return Long.parseLong(param.substring(7));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting userId from session", e);
        }
        return null;
    }

    private String getTabIdFromSession(WebSocketSession session) {
        try {
            String query = session.getUri().getQuery();
            if (query != null) {
                for (String param : query.split("&")) {
                    if (param.startsWith("tabId=")) {
                        return param.substring(6);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting tabId from session", e);
        }
        return null;
    }
}
package com.homekeep.service;

import com.homekeep.dto.*;
import com.homekeep.entity.User;
import com.homekeep.exception.BusinessException;
import com.homekeep.repository.UserRepository;
import com.homekeep.security.JwtTokenProvider;
import com.homekeep.websocket.KickNotificationHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final KickNotificationHandler kickNotificationHandler;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("该手机号已注册");
        }

        User user = new User();
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname() != null ? request.getNickname() : "用户" + request.getPhone().substring(7));

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), null, user.getTokenVersion());
        return new AuthResponse(token, UserDTO.fromEntity(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new BusinessException("手机号或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("手机号或密码错误");
        }

        // Kick existing session via WebSocket first
        kickNotificationHandler.kickUser(user.getId());

        // Increment token version to invalidate previous tokens
        user.setTokenVersion(user.getTokenVersion() == null ? 1 : user.getTokenVersion() + 1);
        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), null, user.getTokenVersion());
        return new AuthResponse(token, UserDTO.fromEntity(user));
    }
}

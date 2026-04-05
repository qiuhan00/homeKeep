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

    /**
     * 用户注册
     * @param request 注册请求，包含手机号、密码和昵称
     * @return 注册成功返回token和用户信息，失败抛出异常
     */
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

    /**
     * 用户登录
     * @param request 登录请求，包含手机号和密码
     * @return 登录成功返回token和用户信息，失败抛出异常；同一用户在其他设备登录会被踢出
     */
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

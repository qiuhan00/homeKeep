package com.homekeep.controller;

import com.homekeep.dto.*;
import com.homekeep.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 用户注册
     * @param request 注册请求，包含手机号、密码、昵称等信息
     * @return 包含 token 和用户信息的响应
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("注册成功", authService.register(request)));
    }

    /**
     * 用户登录
     * @param request 登录请求，包含手机号和密码
     * @return 包含 token 和用户信息的响应
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("登录成功", authService.login(request)));
    }
}

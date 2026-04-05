package com.homekeep.dto;

import com.homekeep.entity.User;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String phone;
    private String nickname;
    private String avatarUrl;

    public static UserDTO fromEntity(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setPhone(user.getPhone());
        dto.setNickname(user.getNickname());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }
}

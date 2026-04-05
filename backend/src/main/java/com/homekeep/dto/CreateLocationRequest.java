package com.homekeep.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateLocationRequest {
    @NotBlank(message = "位置名称不能为空")
    private String name;

    private Long parentId;
}

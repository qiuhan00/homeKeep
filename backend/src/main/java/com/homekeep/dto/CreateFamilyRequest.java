package com.homekeep.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFamilyRequest {
    @NotBlank(message = "家庭名称不能为空")
    private String name;
}

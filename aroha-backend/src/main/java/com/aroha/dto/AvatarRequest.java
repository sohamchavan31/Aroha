package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvatarRequest {

    @NotBlank
    private String avatarKey;
}

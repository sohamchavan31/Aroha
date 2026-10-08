package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RefreshRequest {
    @NotBlank
    @Size(max = 200)
    private String refreshToken;
}

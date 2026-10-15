package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoogleSignInRequest {

    @NotBlank(message = "Missing Google token")
    @Size(max = 4096)
    private String idToken;
}

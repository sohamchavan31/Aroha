package com.aroha.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyEmailRequest {

    @NotBlank(message = "Enter the code from the email")
    @Pattern(regexp = "\\s*\\d{6}\\s*", message = "The code is 6 digits")
    private String code;
}

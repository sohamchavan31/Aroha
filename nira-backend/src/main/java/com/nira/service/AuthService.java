package com.nira.service;

import com.nira.dto.AuthResponse;
import com.nira.dto.LoginRequest;
import com.nira.dto.RegisterRequest;
import com.nira.model.User;
import com.nira.repository.UserRepository;
import com.nira.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .rank("E")
                .totalXp(0)
                .streak(0)
                .profileComplete(false)
                .build();

        userRepository.save(user);

        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user.getEmail()))
                .name(user.getName())
                .rank(user.getRank())
                .totalXp(user.getTotalXp())
                .profileComplete(user.getProfileComplete())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user.getEmail()))
                .name(user.getName())
                .rank(user.getRank())
                .totalXp(user.getTotalXp())
                .profileComplete(user.getProfileComplete())
                .build();
    }
}

package com.aroha.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A 6-digit code we emailed to a user, to verify their address or reset their
 * password. Only a hash is stored; a user has at most one live code per purpose.
 */
@Entity
@Table(name = "email_codes", indexes = @Index(name = "idx_email_codes_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCode {

    public enum Purpose { VERIFY, RESET }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Purpose purpose;

    @Column(name = "code_hash", nullable = false, length = 64)
    private String codeHash;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

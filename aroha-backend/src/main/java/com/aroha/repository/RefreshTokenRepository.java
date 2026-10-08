package com.aroha.repository;

import com.aroha.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Transactional
    void deleteByUserId(Long userId);

    @Transactional
    @Modifying
    @Query("delete from RefreshToken r where r.expiresAt < :now")
    int deleteExpired(Instant now);
}

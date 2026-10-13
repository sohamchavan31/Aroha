package com.aroha.repository;

import com.aroha.model.EmailCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface EmailCodeRepository extends JpaRepository<EmailCode, Long> {
    Optional<EmailCode> findFirstByUserIdAndPurpose(Long userId, EmailCode.Purpose purpose);

    @Transactional
    void deleteByUserIdAndPurpose(Long userId, EmailCode.Purpose purpose);

    @Transactional
    void deleteByUserId(Long userId);
}

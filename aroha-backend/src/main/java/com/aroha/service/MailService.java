package com.aroha.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.UnsupportedEncodingException;

/**
 * Sends the emails that carry sign-up and password-reset codes, over SMTP
 * (Google Workspace by default). With no MAIL_USERNAME set (local dev) the
 * email is written to the log instead of being sent.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSender;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${aroha.mail.from:}")
    private String from;

    public void sendCode(String to, String subject, String heading, String code, String note) {
        if (username == null || username.isBlank()) {
            log.warn("Email is not configured (MAIL_USERNAME is empty). Code for {}: {}", to, code);
            return;
        }
        try {
            MimeMessage message = mailSender.getObject().createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(username, from == null || from.isBlank() ? "Aroha" : from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plain(heading, code, note), html(heading, code, note));
            mailSender.getObject().send(message);
        } catch (MailException | MessagingException | UnsupportedEncodingException e) {
            log.error("Couldn't send '{}' email to {}", subject, to, e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Couldn't send the email. Try again in a minute.");
        }
    }

    private static String plain(String heading, String code, String note) {
        return heading + "\n\n" + code + "\n\n" + note + "\n\nAroha by SOHREX Labs";
    }

    private static String html(String heading, String code, String note) {
        return """
                <div style="font-family:Arial,Helvetica,sans-serif;background:#0f0e0c;padding:32px 16px">
                  <div style="max-width:420px;margin:0 auto;background:#1a1916;border-radius:16px;padding:28px;color:#efe9dd">
                    <div style="font-size:14px;letter-spacing:4px;color:#c9a96e;font-weight:bold">AROHA</div>
                    <p style="font-size:16px;line-height:1.5;margin:20px 0 12px">%s</p>
                    <div style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#efe9dd;background:#24221e;border-radius:12px;padding:16px;text-align:center">%s</div>
                    <p style="font-size:13px;line-height:1.5;color:#a39d91;margin:16px 0 0">%s</p>
                  </div>
                  <p style="text-align:center;font-size:11px;color:#6f6a60;margin-top:16px">Aroha by SOHREX Labs</p>
                </div>
                """.formatted(heading, code, note);
    }
}

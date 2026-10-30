package com.careportal.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Buổi 7: API nhận access token của máy chủ định danh OIDC (Keycloak) bên cạnh token tự phát.
 * Thay Keycloak bằng một máy chủ JWKS nhỏ trong test: cùng cơ chế (RS256 + public key qua HTTP), không cần container.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class SsoTokenTests {

    static final String ISSUER = "http://localhost:8180/realms/care";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    static final RSAKey KEY = generate("kc-key");
    static final HttpServer JWKS = startJwks(KEY);

    @DynamicPropertySource
    static void sso(DynamicPropertyRegistry registry) {
        registry.add("care.sso.issuer-uri", () -> ISSUER);
        registry.add("care.sso.jwk-set-uri", () -> "http://localhost:" + JWKS.getAddress().getPort() + "/certs");
    }

    @AfterAll
    static void stop() {
        JWKS.stop(0);
    }

    @Autowired
    MockMvc mvc;

    @Test
    void acceptsKeycloakAccessToken() throws Exception {
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token(KEY, ISSUER, List.of("care-api", "account"), "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("agent1"))
                .andExpect(jsonPath("$.roles[0]").value("AGENT"));
    }

    @Test
    void rejectsIdTokenBecauseAudienceIsTheClient() throws Exception {
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token(KEY, ISSUER, List.of("care-portal"), "AGENT")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsTokenSignedByAnotherKeyOrUnknownIssuer() throws Exception {
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token(generate("kc-key"), ISSUER, List.of("care-api"), "AGENT")))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me").header("Authorization", "Bearer " + token(KEY, "http://evil.example/realms/care", List.of("care-api"), "AGENT")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rolesFromKeycloakAreEnforcedByServer() throws Exception {
        mvc.perform(post("/api/tickets/1/approve").contentType(MediaType.APPLICATION_JSON).content("{\"version\":0}")
                        .header("Authorization", "Bearer " + token(KEY, ISSUER, List.of("care-api"), "AGENT")))
                .andExpect(status().isForbidden());
    }

    private static String token(RSAKey key, String issuer, List<String> audience, String... roles) throws Exception {
        var now = Instant.now();
        var claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject("6c1f0b9e-agent1")
                .audience(audience)
                .claim("preferred_username", "agent1")
                .claim("name", "Agent One")
                .claim("roles", List.of(roles))
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(300)))
                .build();
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
        jwt.sign(new RSASSASigner(key));
        return jwt.serialize();
    }

    private static RSAKey generate(String kid) {
        try {
            return new RSAKeyGenerator(2048).keyID(kid).generate();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static HttpServer startJwks(RSAKey key) {
        try {
            var server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
            byte[] body = new JWKSet(key.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
            server.createContext("/certs", exchange -> {
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, body.length);
                exchange.getResponseBody().write(body);
                exchange.close();
            });
            server.start();
            return server;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}

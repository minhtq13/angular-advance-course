package com.careportal.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class AuthApiTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private JsonNode login(String username, String password) throws Exception {
        var body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"password\":\"%s\"}".formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body);
    }

    @Test
    void loginIssuesTokensUsableForApi() throws Exception {
        var tokens = login("supervisor1", "supervisor1");
        assertThat(tokens.get("expiresIn").asLong()).isPositive();

        mvc.perform(get("/api/me").header("Authorization", "Bearer " + tokens.get("accessToken").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("supervisor1"))
                .andExpect(jsonPath("$.fullName").value("Supervisor One"))
                .andExpect(jsonPath("$.roles.length()").value(2));
    }

    @Test
    void rejectsWrongPassword() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"agent1\",\"password\":\"sai\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Sai tên đăng nhập hoặc mật khẩu"));
    }

    @Test
    void refreshTokenCannotCallApiButCanRenew() throws Exception {
        var refresh = login("agent1", "agent1").get("refreshToken").asText();

        mvc.perform(get("/api/me").header("Authorization", "Bearer " + refresh))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"%s\"}".formatted(refresh)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void roleFromLocalTokenIsEnforced() throws Exception {
        var agent = login("agent1", "agent1").get("accessToken").asText();
        mvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + agent)).andExpect(status().isForbidden());

        var admin = login("admin1", "admin1").get("accessToken").asText();
        mvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + admin)).andExpect(status().isOk());
    }

    @Test
    void errorMessageFollowsAcceptLanguage() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).header("Accept-Language", "en")
                        .content("{\"username\":\"agent1\",\"password\":\"sai\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Incorrect username or password"));

        // Ngon ngu khong ho tro -> tieng Viet (mac dinh), khong roi ve locale cua may chu.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).header("Accept-Language", "fr")
                        .content("{\"username\":\"agent1\",\"password\":\"sai\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Sai tên đăng nhập hoặc mật khẩu"));
    }
}

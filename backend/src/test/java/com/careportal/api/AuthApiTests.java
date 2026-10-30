package com.careportal.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
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

    private org.springframework.test.web.servlet.ResultActions refresh(String refreshToken) throws Exception {
        return mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)));
    }

    @Test
    void refreshRotatesAndOldTokenCannotBeUsedTwice() throws Exception {
        var r1 = login("agent1", "agent1").get("refreshToken").asText();

        var body = refresh(r1).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var r2 = json.readTree(body).get("refreshToken").asText();
        assertThat(r2).isNotEqualTo(r1);

        // Dùng lại r1 -> 401, và cả family bị revoke: r2 (chưa dùng) cũng hết hiệu lực.
        refresh(r1).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"));
        refresh(r2).andExpect(status().isUnauthorized());
    }

    @Test
    void reuseOnlyRevokesItsOwnFamily() throws Exception {
        var tab1 = login("agent1", "agent1").get("refreshToken").asText();
        var tab2 = login("agent1", "agent1").get("refreshToken").asText();

        refresh(tab1).andExpect(status().isOk());
        refresh(tab1).andExpect(status().isUnauthorized());

        // Phiên đăng nhập khác (tab khác, máy khác) không bị ảnh hưởng.
        refresh(tab2).andExpect(status().isOk());
    }

    @Test
    void concurrentRefreshWithSameTokenOnlyOneSucceeds() throws Exception {
        var r1 = login("agent1", "agent1").get("refreshToken").asText();

        var pool = Executors.newFixedThreadPool(3);
        try {
            List<Future<Integer>> results = new java.util.ArrayList<>();
            for (int i = 0; i < 3; i++) {
                results.add(pool.submit(() -> refresh(r1).andReturn().getResponse().getStatus()));
            }
            var statuses = new java.util.ArrayList<Integer>();
            for (var f : results) {
                statuses.add(f.get());
            }
            assertThat(statuses).containsOnlyOnce(200).contains(401);
        } finally {
            pool.shutdown();
        }
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        var r1 = login("agent1", "agent1").get("refreshToken").asText();

        mvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"%s\"}".formatted(r1)))
                .andExpect(status().isNoContent());
        refresh(r1).andExpect(status().isUnauthorized());

        // Token rác -> vẫn 204: đăng xuất không bao giờ "thất bại" với người dùng.
        mvc.perform(post("/api/auth/logout").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"rac\"}"))
                .andExpect(status().isNoContent());
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

        // Ngôn ngữ không hỗ trợ -> tiếng Việt (mặc định), không rơi về locale của máy chủ.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).header("Accept-Language", "fr")
                        .content("{\"username\":\"agent1\",\"password\":\"sai\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Sai tên đăng nhập hoặc mật khẩu"));
    }
}

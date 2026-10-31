package com.careportal.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.careportal.api.config.RolesClaimConverter;
import com.jayway.jsonpath.JsonPath;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class TicketApiTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    MockMvc mvc;

    private static RequestPostProcessor user(String username, String... roles) {
        return jwt()
                .jwt(j -> j.claim("preferred_username", username).claim("roles", List.of(roles)))
                .authorities(new RolesClaimConverter());
    }

    /** Lấy id và version của một phiếu RESOLVED trong dữ liệu seed, bỏ qua các phiếu đã dùng. */
    private long[] resolvedTicket(int index) throws Exception {
        var json = mvc.perform(get("/api/tickets").param("status", "RESOLVED").param("size", "10").with(user("supervisor1", "SUPERVISOR")))
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(json, "$.content[" + index + "].id");
        Number version = JsonPath.read(json, "$.content[" + index + "].version");
        return new long[] { id.longValue(), version.longValue() };
    }

    private static String version(long v) {
        return "{\"version\":" + v + "}";
    }

    @Test
    void agentCannotApprove() throws Exception {
        long[] t = resolvedTicket(0);
        mvc.perform(post("/api/tickets/{id}/approve", t[0]).with(user("agent1", "AGENT"))
                        .contentType(MediaType.APPLICATION_JSON).content(version(t[1])))
                .andExpect(status().isForbidden());
    }

    /** Buổi 7, regression: PATCH từng cho agent đóng phiếu (status=CLOSED), bỏ qua bước Manager duyệt. */
    @Test
    void nobodyClosesTicketByPatch() throws Exception {
        long[] t = resolvedTicket(2);
        var close = "{\"status\":\"CLOSED\",\"version\":" + t[1] + "}";
        mvc.perform(patch("/api/tickets/{id}", t[0]).with(user("agent1", "AGENT"))
                        .contentType(MediaType.APPLICATION_JSON).content(close))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/tickets/{id}", t[0]).with(user("supervisor1", "AGENT", "SUPERVISOR"))
                        .contentType(MediaType.APPLICATION_JSON).content(close))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/tickets/{id}", t[0]).with(user("agent1", "AGENT")))
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.version").value(t[1]));

        // Các thay đổi khác vẫn được (agent nhận phiếu, đổi độ ưu tiên).
        mvc.perform(patch("/api/tickets/{id}", t[0]).with(user("agent1", "AGENT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"priority\":\"HIGH\",\"version\":" + t[1] + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priority").value("HIGH"));
    }

    @Test
    void secondApproverWithSameVersionGetsConflict() throws Exception {
        long[] t = resolvedTicket(1);
        mvc.perform(post("/api/tickets/{id}/approve", t[0]).with(user("supervisor1", "AGENT", "SUPERVISOR"))
                        .contentType(MediaType.APPLICATION_JSON).content(version(t[1])))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
        mvc.perform(post("/api/tickets/{id}/approve", t[0]).with(user("supervisor2", "AGENT", "SUPERVISOR"))
                        .contentType(MediaType.APPLICATION_JSON).content(version(t[1])))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").exists());
    }

    /** Buổi 8: lọc theo loại yêu cầu ở server; tham số sai tên bị bỏ qua (không lọc), giá trị sai -> 400. */
    @Test
    void filtersByCategory() throws Exception {
        var json = mvc.perform(get("/api/tickets").param("category", "BILLING").param("size", "50").with(user("agent1", "AGENT")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<String> categories = JsonPath.read(json, "$.content[*].category");
        assertThat(categories).isNotEmpty().containsOnly("BILLING");

        var ignored = mvc.perform(get("/api/tickets").param("type", "BILLING").param("size", "50").with(user("agent1", "AGENT")))
                .andReturn().getResponse().getContentAsString();
        List<String> all = JsonPath.read(ignored, "$.content[*].category");
        assertThat(all).contains("BILLING").anyMatch(c -> !c.equals("BILLING"));

        mvc.perform(get("/api/tickets").param("category", "abc").with(user("agent1", "AGENT")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsBlankTitle() throws Exception {
        var body = "{\"subscriberId\":1,\"category\":\"BILLING\",\"priority\":\"LOW\",\"title\":\"   \"}";
        mvc.perform(post("/api/tickets").with(user("agent1", "AGENT")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void sameIdempotencyKeyCreatesOneTicket() throws Exception {
        var key = UUID.randomUUID().toString();
        var body = "{\"subscriberId\":1,\"category\":\"BILLING\",\"priority\":\"LOW\",\"title\":\"Cuoc bat thuong\"}";
        var first = mvc.perform(post("/api/tickets").with(user("agent1", "AGENT")).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Idempotent-Replayed", "false"))
                .andReturn().getResponse().getContentAsString();
        var second = mvc.perform(post("/api/tickets").with(user("agent1", "AGENT")).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Idempotent-Replayed", "true"))
                .andReturn().getResponse().getContentAsString();
        Number firstId = JsonPath.read(first, "$.id");
        Number secondId = JsonPath.read(second, "$.id");
        assertThat(secondId.longValue()).isEqualTo(firstId.longValue());

        var other = body.replace("Cuoc bat thuong", "Noi dung khac");
        mvc.perform(post("/api/tickets").with(user("agent1", "AGENT")).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(other))
                .andExpect(status().isConflict());
    }
}

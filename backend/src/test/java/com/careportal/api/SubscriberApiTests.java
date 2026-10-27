package com.careportal.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.careportal.api.config.RolesClaimConverter;
import java.util.List;
import java.util.Map;
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
class SubscriberApiTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    MockMvc mvc;

    private static RequestPostProcessor user(String username, String... roles) {
        return jwt()
                .jwt(j -> j.claim("preferred_username", username).claim("realm_access", Map.of("roles", List.of(roles))))
                .authorities(new RolesClaimConverter());
    }

    @Test
    void rejectsAnonymous() throws Exception {
        mvc.perform(get("/api/subscribers")).andExpect(status().isUnauthorized());
    }

    @Test
    void searchesSeededSubscribersByMsisdnPrefix() throws Exception {
        mvc.perform(get("/api/subscribers").param("q", "0900000001").with(user("agent1", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].msisdn").value("0900000001"));
    }

    @Test
    void createsSubscriberAndRejectsDuplicate() throws Exception {
        var body = """
                {"msisdn":"0812345678","fullName":"Nguyễn Văn Test","idNumber":"001099012345",
                 "dateOfBirth":"1990-05-20","province":"Hà Nội","type":"PREPAID","planCode":"D70"}
                """;
        mvc.perform(post("/api/subscribers").with(user("agent1", "AGENT")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(post("/api/subscribers").with(user("agent1", "AGENT")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void validatesCreateRequest() throws Exception {
        mvc.perform(post("/api/subscribers").with(user("agent1", "AGENT")).contentType(MediaType.APPLICATION_JSON).content("{\"msisdn\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.msisdn").exists());
    }

    @Test
    void onlySupervisorCanChangeStatus() throws Exception {
        var body = "{\"status\":\"SUSPENDED\",\"version\":0}";
        mvc.perform(patch("/api/subscribers/2/status").with(user("agent1", "AGENT")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/subscribers/2/status").with(user("sup1", "SUPERVISOR")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
    }

    @Test
    void listsTicketsWithSubscriberInfo() throws Exception {
        mvc.perform(get("/api/tickets").param("size", "5").with(user("agent1", "AGENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(5))
                .andExpect(jsonPath("$.content[0].subscriberMsisdn").exists());
    }

    @Test
    void adminStatsRequiresAdmin() throws Exception {
        mvc.perform(get("/api/admin/stats").with(user("agent1", "AGENT"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/stats").with(user("admin1", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscribersByStatus.ACTIVE").exists());
    }

    @Test
    void conflictAndValidationMessagesAreLocalized() throws Exception {
        var duplicate = """
                {"msisdn":"0900000001","fullName":"Test","idNumber":"001099012345",
                 "dateOfBirth":"1990-05-20","province":"Hà Nội","type":"PREPAID","planCode":"D70"}
                """;
        mvc.perform(post("/api/subscribers").with(user("agent1", "AGENT")).header("Accept-Language", "en")
                        .contentType(MediaType.APPLICATION_JSON).content(duplicate))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Phone number 0900000001 already exists"));

        var wrongPlan = duplicate.replace("0900000001", "0811111111").replace("D70", "PT199");
        mvc.perform(post("/api/subscribers").with(user("agent1", "AGENT"))
                        .contentType(MediaType.APPLICATION_JSON).content(wrongPlan))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Gói cước PT199 không áp dụng cho thuê bao trả trước"));

        mvc.perform(get("/api/subscribers/999999999").with(user("agent1", "AGENT")).header("Accept-Language", "en"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("The subscriber 999999999 was not found"));

        mvc.perform(post("/api/subscribers").with(user("agent1", "AGENT")).header("Accept-Language", "en")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"msisdn\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Invalid data"))
                .andExpect(jsonPath("$.errors.msisdn").value("Phone number must be 10 digits starting with 0"));
    }
}

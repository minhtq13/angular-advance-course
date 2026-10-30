package com.careportal.api.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.Arrays;
import java.util.List;
import lombok.Getter;

@Entity
@Table(name = "app_user")
@Getter
public class AppUser {

    @Id
    private String username;
    private String passwordHash;
    private String fullName;
    private String email;
    /** Lưu dạng "AGENT,SUPERVISOR". */
    private String roles;
    private boolean enabled;

    public List<String> roleList() {
        return Arrays.stream(roles.split(",")).map(String::trim).filter(r -> !r.isEmpty()).toList();
    }
}

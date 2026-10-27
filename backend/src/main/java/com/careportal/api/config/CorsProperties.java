package com.careportal.api.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("care.cors")
public record CorsProperties(List<String> allowedOrigins) {
}

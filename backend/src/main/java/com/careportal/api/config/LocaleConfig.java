package com.careportal.api.config;

import java.util.List;
import java.util.Locale;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

/** Chọn ngôn ngữ theo header Accept-Language (FE gửi kèm mọi request); không có / không hỗ trợ -> tiếng Việt. */
@Configuration
public class LocaleConfig {

    public static final Locale VIETNAMESE = Locale.forLanguageTag("vi");

    @Bean
    LocaleResolver localeResolver() {
        var resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(List.of(VIETNAMESE, Locale.ENGLISH));
        resolver.setDefaultLocale(VIETNAMESE);
        return resolver;
    }
}

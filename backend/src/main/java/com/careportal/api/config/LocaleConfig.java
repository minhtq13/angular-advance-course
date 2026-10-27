package com.careportal.api.config;

import java.util.List;
import java.util.Locale;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

/** Chon ngon ngu theo header Accept-Language (FE gui kem moi request); khong co / khong ho tro -> tieng Viet. */
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

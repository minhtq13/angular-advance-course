package com.careportal.api.subscriber;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public final class SubscriberDtos {

    private SubscriberDtos() {
    }

    public record SubscriberDto(
            Long id,
            String msisdn,
            String fullName,
            String idNumber,
            LocalDate dateOfBirth,
            String province,
            SubscriberType type,
            SubscriberStatus status,
            String planCode,
            Instant activatedAt,
            Instant updatedAt,
            long version) {
    }

    public record CreateSubscriberRequest(
            @NotBlank @Pattern(regexp = "0\\d{9}", message = "{validation.msisdn}") String msisdn,
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Pattern(regexp = "\\d{12}", message = "{validation.idNumber}") String idNumber,
            @NotNull @Past LocalDate dateOfBirth,
            @NotBlank String province,
            @NotNull SubscriberType type,
            @NotBlank String planCode) {
    }

    public record ChangeStatusRequest(@NotNull SubscriberStatus status, long version) {
    }

    public record MsisdnAvailability(String msisdn, boolean available) {
    }
}

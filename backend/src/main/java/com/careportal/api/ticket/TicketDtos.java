package com.careportal.api.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class TicketDtos {

    private TicketDtos() {
    }

    public record TicketDto(
            Long id,
            String code,
            Long subscriberId,
            String subscriberMsisdn,
            String subscriberName,
            TicketCategory category,
            TicketPriority priority,
            TicketStatus status,
            String title,
            String description,
            String assignee,
            String createdBy,
            Instant createdAt,
            Instant updatedAt,
            long version) {
    }

    public record TicketSearch(TicketStatus status, TicketPriority priority, Long subscriberId, String assignee) {
    }

    public record CreateTicketRequest(
            @NotNull Long subscriberId,
            @NotNull TicketCategory category,
            @NotNull TicketPriority priority,
            @NotBlank @Size(max = 200) String title,
            @Size(max = 4000) String description) {
    }

    /** Manager phe duyet ket qua xu ly (RESOLVED -> CLOSED). version: ban ma nguoi duyet dang nhin thay. */
    public record ApproveTicketRequest(long version) {
    }

    /** Cap nhat tung phan; truong null = giu nguyen. version dung cho optimistic locking. */
    public record UpdateTicketRequest(TicketStatus status, TicketPriority priority, String assignee, long version) {
    }
}

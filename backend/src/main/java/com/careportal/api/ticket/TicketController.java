package com.careportal.api.ticket;

import com.careportal.api.common.IdempotencyStore;
import com.careportal.api.common.PageResponse;
import com.careportal.api.ticket.TicketDtos.ApproveTicketRequest;
import com.careportal.api.ticket.TicketDtos.CreateTicketRequest;
import com.careportal.api.ticket.TicketDtos.TicketDto;
import com.careportal.api.ticket.TicketDtos.TicketSearch;
import com.careportal.api.ticket.TicketDtos.UpdateTicketRequest;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    static final String IDEMPOTENCY_KEY = "Idempotency-Key";
    static final String REPLAYED = "Idempotent-Replayed";

    private final TicketService service;
    private final IdempotencyStore idempotency;

    @GetMapping
    public PageResponse<TicketDto> search(
            @ParameterObject TicketSearch search,
            @ParameterObject @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(search, pageable);
    }

    @GetMapping("/{id}")
    public TicketDto get(@PathVariable long id) {
        return service.get(id);
    }

    /**
     * Gửi kèm header Idempotency-Key (UUID do client sinh cho mỗi lần "tạo phiếu") thì gửi lại bao nhiêu lần
     * cũng chỉ tạo một phiếu; lần gửi lại nhận header Idempotent-Replayed: true.
     */
    @PostMapping
    public ResponseEntity<TicketDto> create(
            @Valid @RequestBody CreateTicketRequest request,
            @RequestHeader(name = IDEMPOTENCY_KEY, required = false) String idempotencyKey,
            Principal principal) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, principal.getName()));
        }
        var outcome = idempotency.execute(principal.getName(), idempotencyKey, request,
                () -> service.create(request, principal.getName()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(REPLAYED, String.valueOf(outcome.replayed()))
                .body(outcome.result());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public TicketDto approve(@PathVariable long id, @Valid @RequestBody ApproveTicketRequest request) {
        return service.approve(id, request.version());
    }

    /**
     * Sửa trạng thái, độ ưu tiên, người xử lý. Không ai được đóng phiếu (CLOSED) bằng PATCH:
     * đóng phiếu là việc của Manager qua /approve (có kiểm tra vai trò và trạng thái RESOLVED).
     */
    @PatchMapping("/{id}")
    @PreAuthorize("#request.status() != T(com.careportal.api.ticket.TicketStatus).CLOSED")
    public TicketDto update(@PathVariable long id, @Valid @RequestBody UpdateTicketRequest request) {
        return service.update(id, request);
    }
}

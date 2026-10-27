package com.careportal.api.ticket;

import com.careportal.api.common.PageResponse;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService service;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDto create(@Valid @RequestBody CreateTicketRequest request, Principal principal) {
        return service.create(request, principal.getName());
    }

    @PatchMapping("/{id}")
    public TicketDto update(@PathVariable long id, @Valid @RequestBody UpdateTicketRequest request) {
        return service.update(id, request);
    }
}

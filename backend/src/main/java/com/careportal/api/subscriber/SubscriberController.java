package com.careportal.api.subscriber;

import com.careportal.api.common.PageResponse;
import com.careportal.api.subscriber.SubscriberDtos.ChangeStatusRequest;
import com.careportal.api.subscriber.SubscriberDtos.CreateSubscriberRequest;
import com.careportal.api.subscriber.SubscriberDtos.MsisdnAvailability;
import com.careportal.api.subscriber.SubscriberDtos.SubscriberDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscribers")
@RequiredArgsConstructor
public class SubscriberController {

    private final SubscriberService service;

    @GetMapping
    public PageResponse<SubscriberDto> search(
            @ParameterObject SubscriberSearch search,
            @ParameterObject @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(search, pageable);
    }

    @GetMapping("/{id}")
    public SubscriberDto get(@PathVariable long id) {
        return service.get(id);
    }

    @GetMapping("/msisdn-availability")
    public MsisdnAvailability checkMsisdn(@RequestParam String msisdn) {
        return new MsisdnAvailability(msisdn, service.isMsisdnAvailable(msisdn));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriberDto create(@Valid @RequestBody CreateSubscriberRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    public SubscriberDto changeStatus(@PathVariable long id, @Valid @RequestBody ChangeStatusRequest request) {
        return service.changeStatus(id, request);
    }
}

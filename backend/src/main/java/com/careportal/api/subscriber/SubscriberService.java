package com.careportal.api.subscriber;

import com.careportal.api.common.ConflictException;
import com.careportal.api.common.LocalizedException.Translatable;
import com.careportal.api.common.NotFoundException;
import com.careportal.api.common.PageResponse;
import com.careportal.api.plan.ServicePlanRepository;
import com.careportal.api.subscriber.SubscriberDtos.ChangeStatusRequest;
import com.careportal.api.subscriber.SubscriberDtos.CreateSubscriberRequest;
import com.careportal.api.subscriber.SubscriberDtos.SubscriberDto;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubscriberService {

    private final SubscriberRepository repository;
    private final ServicePlanRepository planRepository;
    private final SubscriberMapper mapper;

    public PageResponse<SubscriberDto> search(SubscriberSearch search, Pageable pageable) {
        return PageResponse.of(repository.findAll(SubscriberSpecs.matches(search), pageable).map(mapper::toDto));
    }

    public SubscriberDto get(long id) {
        return mapper.toDto(find(id));
    }

    public boolean isMsisdnAvailable(String msisdn) {
        return !repository.existsByMsisdn(msisdn);
    }

    @Transactional
    public SubscriberDto create(CreateSubscriberRequest request) {
        if (repository.existsByMsisdn(request.msisdn())) {
            throw new ConflictException("error.msisdnExists", request.msisdn());
        }
        var plan = planRepository.findById(request.planCode())
                .orElseThrow(() -> new NotFoundException("resource.servicePlan", request.planCode()));
        if (plan.getType() != request.type()) {
            throw new ConflictException(
                    "error.planTypeMismatch", plan.getCode(), new Translatable("subscriberType." + request.type()));
        }
        var subscriber = mapper.toEntity(request);
        subscriber.setStatus(SubscriberStatus.ACTIVE);
        subscriber.setActivatedAt(Instant.now());
        return mapper.toDto(repository.save(subscriber));
    }

    @Transactional
    public SubscriberDto changeStatus(long id, ChangeStatusRequest request) {
        var subscriber = find(id);
        if (subscriber.getVersion() != request.version()) {
            throw new ConflictException("error.staleData");
        }
        if (subscriber.getStatus() == SubscriberStatus.TERMINATED) {
            throw new ConflictException("error.subscriberTerminated");
        }
        subscriber.setStatus(request.status());
        return mapper.toDto(repository.saveAndFlush(subscriber));
    }

    private Subscriber find(long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("resource.subscriber", id));
    }
}

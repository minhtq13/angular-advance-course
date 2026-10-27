package com.careportal.api.plan;

import com.careportal.api.subscriber.SubscriberType;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/service-plans")
@RequiredArgsConstructor
public class ServicePlanController {

    private final ServicePlanRepository repository;

    @GetMapping
    @Cacheable(cacheNames = "service-plans", key = "#type == null ? 'ALL' : #type.name()")
    public List<ServicePlanDto> list(@RequestParam(required = false) SubscriberType type) {
        var plans = type == null
                ? repository.findByActiveTrueOrderByMonthlyFee()
                : repository.findByActiveTrueAndTypeOrderByMonthlyFee(type);
        return new ArrayList<>(plans.stream().map(ServicePlanDto::from).toList());
    }
}

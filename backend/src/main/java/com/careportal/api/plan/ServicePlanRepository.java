package com.careportal.api.plan;

import com.careportal.api.subscriber.SubscriberType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServicePlanRepository extends JpaRepository<ServicePlan, String> {

    List<ServicePlan> findByActiveTrueOrderByMonthlyFee();

    List<ServicePlan> findByActiveTrueAndTypeOrderByMonthlyFee(SubscriberType type);
}

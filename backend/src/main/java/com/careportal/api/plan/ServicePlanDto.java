package com.careportal.api.plan;

import com.careportal.api.subscriber.SubscriberType;
import java.io.Serializable;
import java.math.BigDecimal;

public record ServicePlanDto(String code, String name, SubscriberType type, BigDecimal monthlyFee, int dataGb)
        implements Serializable {

    static ServicePlanDto from(ServicePlan plan) {
        return new ServicePlanDto(plan.getCode(), plan.getName(), plan.getType(), plan.getMonthlyFee(), plan.getDataGb());
    }
}

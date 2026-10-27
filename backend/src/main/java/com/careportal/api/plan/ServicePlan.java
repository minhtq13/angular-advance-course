package com.careportal.api.plan;

import com.careportal.api.subscriber.SubscriberType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;

@Entity
@Table(name = "service_plan")
@Getter
public class ServicePlan {

    @Id
    private String code;
    private String name;
    @Enumerated(EnumType.STRING)
    private SubscriberType type;
    private BigDecimal monthlyFee;
    private int dataGb;
    private boolean active;
}

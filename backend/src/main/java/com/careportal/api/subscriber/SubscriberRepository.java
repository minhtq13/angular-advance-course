package com.careportal.api.subscriber;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface SubscriberRepository extends JpaRepository<Subscriber, Long>, JpaSpecificationExecutor<Subscriber> {

    boolean existsByMsisdn(String msisdn);

    @Query("select s.status as status, count(s) as total from Subscriber s group by s.status")
    List<StatusCount> countByStatus();

    interface StatusCount {
        SubscriberStatus getStatus();

        long getTotal();
    }
}

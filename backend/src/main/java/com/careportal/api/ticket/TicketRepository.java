package com.careportal.api.ticket;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    @Query(value = "select nextval('ticket_code_seq')", nativeQuery = true)
    long nextCodeValue();

    @Query("select t.status as status, count(t) as total from Ticket t group by t.status")
    List<StatusCount> countByStatus();

    interface StatusCount {
        TicketStatus getStatus();

        long getTotal();
    }
}

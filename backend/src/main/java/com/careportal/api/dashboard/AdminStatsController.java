package com.careportal.api.dashboard;

import com.careportal.api.subscriber.SubscriberRepository;
import com.careportal.api.ticket.TicketRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Chi ADMIN (cau hinh trong SecurityConfig cho /api/admin/**). */
@RestController
@RequiredArgsConstructor
public class AdminStatsController {

    private final SubscriberRepository subscriberRepository;
    private final TicketRepository ticketRepository;

    public record StatsDto(Map<String, Long> subscribersByStatus, Map<String, Long> ticketsByStatus) {
    }

    @GetMapping("/api/admin/stats")
    public StatsDto stats() {
        Map<String, Long> subscribers = new LinkedHashMap<>();
        subscriberRepository.countByStatus().forEach(c -> subscribers.put(c.getStatus().name(), c.getTotal()));
        Map<String, Long> tickets = new LinkedHashMap<>();
        ticketRepository.countByStatus().forEach(c -> tickets.put(c.getStatus().name(), c.getTotal()));
        return new StatsDto(subscribers, tickets);
    }
}

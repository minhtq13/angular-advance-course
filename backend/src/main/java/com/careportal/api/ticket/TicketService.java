package com.careportal.api.ticket;

import com.careportal.api.common.ConflictException;
import com.careportal.api.common.NotFoundException;
import com.careportal.api.common.PageResponse;
import com.careportal.api.subscriber.SubscriberRepository;
import com.careportal.api.ticket.TicketDtos.CreateTicketRequest;
import com.careportal.api.ticket.TicketDtos.TicketDto;
import com.careportal.api.ticket.TicketDtos.TicketSearch;
import com.careportal.api.ticket.TicketDtos.UpdateTicketRequest;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository repository;
    private final SubscriberRepository subscriberRepository;
    private final TicketMapper mapper;

    public PageResponse<TicketDto> search(TicketSearch search, Pageable pageable) {
        Specification<Ticket> fetchSubscriber = (root, query, cb) -> {
            // Tranh N+1 khi map subscriberMsisdn/subscriberName; khong fetch trong cau count.
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("subscriber", JoinType.INNER);
            }
            return null;
        };
        Specification<Ticket> spec = Specification.allOf(
                fetchSubscriber,
                search.status() == null ? null : (root, q, cb) -> cb.equal(root.get("status"), search.status()),
                search.priority() == null ? null : (root, q, cb) -> cb.equal(root.get("priority"), search.priority()),
                search.subscriberId() == null ? null : (root, q, cb) -> cb.equal(root.get("subscriber").get("id"), search.subscriberId()),
                !StringUtils.hasText(search.assignee()) ? null : (root, q, cb) -> cb.equal(root.get("assignee"), search.assignee()));
        return PageResponse.of(repository.findAll(spec, pageable).map(mapper::toDto));
    }

    public TicketDto get(long id) {
        return mapper.toDto(find(id));
    }

    @Transactional
    public TicketDto create(CreateTicketRequest request, String username) {
        var subscriber = subscriberRepository.findById(request.subscriberId())
                .orElseThrow(() -> new NotFoundException("resource.subscriber", request.subscriberId()));
        var ticket = new Ticket();
        ticket.setCode("TK-%07d".formatted(repository.nextCodeValue()));
        ticket.setSubscriber(subscriber);
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setStatus(TicketStatus.NEW);
        ticket.setTitle(request.title());
        ticket.setDescription(request.description());
        ticket.setCreatedBy(username);
        return mapper.toDto(repository.save(ticket));
    }

    @Transactional
    public TicketDto update(long id, UpdateTicketRequest request) {
        var ticket = find(id);
        if (ticket.getVersion() != request.version()) {
            throw new ConflictException("error.staleData");
        }
        if (request.status() != null) {
            ticket.setStatus(request.status());
        }
        if (request.priority() != null) {
            ticket.setPriority(request.priority());
        }
        if (request.assignee() != null) {
            ticket.setAssignee(request.assignee().isBlank() ? null : request.assignee());
        }
        return mapper.toDto(repository.saveAndFlush(ticket));
    }

    private Ticket find(long id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("resource.ticket", id));
    }
}

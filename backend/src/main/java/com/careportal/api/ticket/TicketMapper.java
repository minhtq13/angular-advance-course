package com.careportal.api.ticket;

import com.careportal.api.ticket.TicketDtos.TicketDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface TicketMapper {

    @Mapping(target = "subscriberId", source = "subscriber.id")
    @Mapping(target = "subscriberMsisdn", source = "subscriber.msisdn")
    @Mapping(target = "subscriberName", source = "subscriber.fullName")
    TicketDto toDto(Ticket ticket);
}

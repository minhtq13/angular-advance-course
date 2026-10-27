package com.careportal.api.subscriber;

import com.careportal.api.subscriber.SubscriberDtos.CreateSubscriberRequest;
import com.careportal.api.subscriber.SubscriberDtos.SubscriberDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface SubscriberMapper {

    SubscriberDto toDto(Subscriber subscriber);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "activatedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    Subscriber toEntity(CreateSubscriberRequest request);
}

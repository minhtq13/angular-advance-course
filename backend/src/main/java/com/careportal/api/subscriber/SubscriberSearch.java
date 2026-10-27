package com.careportal.api.subscriber;

public record SubscriberSearch(String q, SubscriberStatus status, SubscriberType type, String province) {
}

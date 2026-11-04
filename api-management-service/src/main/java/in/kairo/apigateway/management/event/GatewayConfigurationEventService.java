package in.kairo.apigateway.management.event;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class GatewayConfigurationEventService {

    private final ApplicationEventPublisher applicationEventPublisher;

    public GatewayConfigurationEventService(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    public void publish(String changeType, Long organizationId, String routeId, Long configurationVersion) {
        applicationEventPublisher.publishEvent(new GatewayConfigurationChangeEvent(
                UUID.randomUUID().toString(), "GATEWAY_CONFIGURATION_CHANGED", changeType,
                organizationId, routeId, configurationVersion, LocalDateTime.now()
        ));
    }
}

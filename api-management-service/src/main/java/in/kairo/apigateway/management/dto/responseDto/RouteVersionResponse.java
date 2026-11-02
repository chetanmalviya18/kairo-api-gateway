package in.kairo.apigateway.management.dto.responseDto;

import in.kairo.apigateway.management.entity.ApiRoute;
import in.kairo.apigateway.management.entity.RouteConfigurationVersion;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RouteVersionResponse {
    private Long id;
    private String routeId;
    private Long versionNumber;
    private String changeType;
    private String configurationSnapshot;
    private LocalDateTime createdAt;

    public static RouteVersionResponse from(RouteConfigurationVersion routeConfigurationVersion) {
        return new RouteVersionResponse(
                routeConfigurationVersion.getId(), routeConfigurationVersion.getRouteId(),
                routeConfigurationVersion.getVersionNumber(), routeConfigurationVersion.getChangeType(),
                routeConfigurationVersion.getConfigurationSnapshot(),  routeConfigurationVersion.getCreatedAt()
        );
    }
}

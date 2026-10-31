package in.kairo.apigateway.management.dto.responseDto;

import in.kairo.apigateway.management.entity.ApiRoute;
import in.kairo.apigateway.management.entity.RouteHeaderRule;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Getter
@AllArgsConstructor
public class RouteResponse {
    private Long id;
    private Long organizationId;
    private String routeId;
    private String name;
    private String pathPattern;
    private String targetBaseUrl;
    private String targetPathPrefix;
    private Integer requestsPerMinute;
    private Integer responseTimeoutMs;
    private boolean idempotencyEnabled;
    private boolean active;
    private Long configurationVersion;
    private Set<String> allowedMethods;
    private List<HeaderRuleResponse> headerRules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RouteResponse from(ApiRoute apiRoute) {

        List<HeaderRuleResponse> rules = new ArrayList<HeaderRuleResponse>();
        for(RouteHeaderRule rule : apiRoute.getRouteHeaderRules()) {
            rules.add(HeaderRuleResponse.from(rule));
        }

        return new RouteResponse(apiRoute.getId(), apiRoute.getOrganization().getId(), apiRoute.getRouteId(),
                apiRoute.getName(), apiRoute.getPathPattern(), apiRoute.getTargetBaseUrl(), apiRoute.getTargetPathPrefix(),
                apiRoute.getRequestPerMinute(), apiRoute.getResponseTimeoutMs(), apiRoute.isIdempotencyEnabled(),
                apiRoute.isActive(), apiRoute.getConfigurationVersion(), apiRoute.getAllowedMethods(), rules,
                apiRoute.getCreatedAt(), apiRoute.getUpdatedAt());
    }
}

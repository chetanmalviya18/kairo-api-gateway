package in.kairo.apigateway.management.service;

import in.kairo.apigateway.management.dto.requestDto.HeaderRuleRequest;
import in.kairo.apigateway.management.dto.requestDto.RouteRequest;
import in.kairo.apigateway.management.dto.requestDto.RouteStatusRequest;
import in.kairo.apigateway.management.dto.responseDto.RouteResponse;
import in.kairo.apigateway.management.entity.ApiRoute;
import in.kairo.apigateway.management.entity.Organization;
import in.kairo.apigateway.management.entity.RouteHeaderRule;
import in.kairo.apigateway.management.exception.ApiException;
import in.kairo.apigateway.management.repository.ApiRouteRepository;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class RouteService {

    private final TenantContext tenantContext;
    private final ApiRouteRepository apiRouteRepository;

    public RouteService(TenantContext tenantContext, ApiRouteRepository apiRouteRepository) {
        this.tenantContext = tenantContext;
        this.apiRouteRepository = apiRouteRepository;
    }

    @Transactional
    public RouteResponse create(RouteRequest routeRequest) {
        long startedAt = System.nanoTime();

        Organization organization = tenantContext.getTenantOrganization();
        validate(routeRequest, organization);

        if(apiRouteRepository.existsByOrganizationIdAndRouteId(organization.getId(), routeRequest.getRouteId()))
            throw new ApiException(HttpStatus.CONFLICT, "Route ID already exists for this organization");

        ApiRoute apiRoute= new ApiRoute();
        apiRoute.setOrganization(organization);
        apiRoute.setConfigurationVersion(1L);
        apiRoute.setCreatedAt(LocalDateTime.now());
        apply(apiRoute, routeRequest);

        apiRouteRepository.save(apiRoute);

        return RouteResponse.from(apiRoute);
    }

    @Transactional(readOnly = true)
    public List<RouteResponse> findAllForTenant() {
        Organization organization = tenantContext.getTenantOrganization();
        return toResponse(apiRouteRepository.findAllByOrganizationId(organization.getId()));
    }

    @Transactional(readOnly = true)
    public RouteResponse findById(Long id) {
        Organization organization = tenantContext.getTenantOrganization();
        return RouteResponse.from(getTenantRoute(id, organization.getId()));
    }

    @Transactional(readOnly = true)
    public RouteResponse update(Long id, RouteRequest routeRequest) {
        long startedAt = System.nanoTime();

        Organization organization = tenantContext.getTenantOrganization();
        ApiRoute apiRoute = getTenantRoute(id, organization.getId());

        if(!apiRoute.getRouteId().equals(routeRequest.getRouteId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "routeId doesn't match");
        }

        validate(routeRequest, organization);

        apiRoute.setConfigurationVersion(apiRoute.getConfigurationVersion() + 1);

        apply(apiRoute, routeRequest);

        return RouteResponse.from(apiRoute);
    }

    @Transactional
    public RouteResponse changeStatus(Long id, RouteStatusRequest routeStatusRequest) {
        long startedAt = System.nanoTime();

        Organization organization = tenantContext.getTenantOrganization();
        ApiRoute apiRoute = getTenantRoute(id, organization.getId());

        apiRoute.setActive(routeStatusRequest.getActive());
        apiRoute.setConfigurationVersion(apiRoute.getConfigurationVersion() + 1);
        apiRoute.setUpdatedAt(LocalDateTime.now());

        return RouteResponse.from(apiRoute);
    }

    private ApiRoute getTenantRoute(Long id, Long organizationId) {
        return apiRouteRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route Not Found"));
    }

    private List<RouteResponse> toResponse(List<ApiRoute> apiRoutes) {
        List<RouteResponse> response = new ArrayList<>();
        for(ApiRoute apiRoute : apiRoutes) {
            response.add(RouteResponse.from(apiRoute));
        }
        return response;
    }

    private void apply(ApiRoute apiRoute, RouteRequest routeRequest) {
        apiRoute.setRouteId(routeRequest.getRouteId());
        apiRoute.setName(routeRequest.getName());
        apiRoute.setPathPattern(routeRequest.getPathPattern());
        apiRoute.setTargetBaseUrl(routeRequest.getTargetBaseUrl());
        apiRoute.setTargetPathPrefix(routeRequest.getTargetPathPrefix());
        apiRoute.setRequestPerMinute(routeRequest.getRequestsPerMinute());
        apiRoute.setResponseTimeoutMs(routeRequest.getResponseTimeoutMs());
        apiRoute.setIdempotencyEnabled(routeRequest.isIdempotencyEnabled());
        apiRoute.setActive(routeRequest.isActive());
        apiRoute.setUpdatedAt(LocalDateTime.now());
        apiRoute.setAllowedMethods(normalizeMethods(routeRequest.getAllowedMethods()));

//        routeRequest.getHeaderRules().clear();
        for(HeaderRuleRequest ruleRequest : routeRequest.getHeaderRules()) {
            RouteHeaderRule routeHeaderRule = new RouteHeaderRule();

            routeHeaderRule.setApiRoute(apiRoute);
            routeHeaderRule.setDirection(ruleRequest.getDirection().toUpperCase(Locale.ENGLISH));
            routeHeaderRule.setAction(ruleRequest.getAction());
            routeHeaderRule.setHeaderName(ruleRequest.getHeaderName());
            routeHeaderRule.setHeaderValue(ruleRequest.getHeaderValue());
            routeHeaderRule.setCreatedAt(LocalDateTime.now());
            routeHeaderRule.setUpdatedAt(LocalDateTime.now());
        }
    }

    private void validate(RouteRequest routeRequest, Organization organization) {
        String tenantPrefix = "/" + organization.getSlug() + "/";

        if(!routeRequest.getPathPattern().startsWith(tenantPrefix))
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "pathPattern must start with tenant prefix: " + tenantPrefix);

        if(!routeRequest.getTargetPathPrefix().startsWith("/"))
            throw new ApiException(HttpStatus.BAD_REQUEST, "targetPathPrefix must start with /");

        try {
            URI uri = URI.create(routeRequest.getTargetBaseUrl());
            if(!"http".equalsIgnoreCase(uri.getScheme()) &&
                !"https".equalsIgnoreCase(uri.getScheme())) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "targetBaseUrl must be a valid HTTP or HTTPS URL");
        }

        normalizeMethods(routeRequest.getAllowedMethods());

        for(HeaderRuleRequest rule : routeRequest.getHeaderRules()) {
            String direction = rule.getDirection().toUpperCase(Locale.ENGLISH);
            String action = rule.getAction().toUpperCase(Locale.ENGLISH);

            if(!"REQUEST".equals(direction) && !"RESPONSE".equals(action)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "direction and action must be either REQUEST or RESPONSE");
            }

            if(!"ADD".equals(action) && !"REMOVE".equals(action)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Header action must be ADD or REMOVE");
            }

            if("ADD".equals(action) &&
                    (rule.getHeaderValue() == null || rule.getHeaderValue().trim().isEmpty())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "ADD header rules require headerValue");
            }
        }
    }

    private Set<String> normalizeMethods(Set<String> allowedMethods) {
        Set<String> normalized = new HashSet<String>();

        for(String method: allowedMethods) {
            String value = method.toUpperCase(Locale.ENGLISH);
            try {
                HttpMethod.valueOf(value);
            } catch (IllegalArgumentException exception) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid HTTP method: " + method);
            }
            normalized.add(value);
        }
        return normalized;
    }
}

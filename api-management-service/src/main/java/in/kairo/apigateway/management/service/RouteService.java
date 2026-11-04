package in.kairo.apigateway.management.service;

import in.kairo.apigateway.management.dto.requestDto.HeaderRuleRequest;
import in.kairo.apigateway.management.dto.requestDto.RouteRequest;
import in.kairo.apigateway.management.dto.requestDto.RouteStatusRequest;
import in.kairo.apigateway.management.dto.responseDto.AuditRecordResponse;
import in.kairo.apigateway.management.dto.responseDto.RouteResponse;
import in.kairo.apigateway.management.dto.responseDto.RouteVersionResponse;
import in.kairo.apigateway.management.entity.*;
import in.kairo.apigateway.management.event.GatewayConfigurationEventService;
import in.kairo.apigateway.management.exception.ApiException;
import in.kairo.apigateway.management.repository.ApiRouteRepository;
import in.kairo.apigateway.management.repository.ControlPlaneAuditRecordRepository;
import in.kairo.apigateway.management.repository.RouteConfigurationVersionRepository;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class RouteService {

    private final TenantContext tenantContext;
    private final ApiRouteRepository apiRouteRepository;
    private final RouteConfigurationVersionRepository versionRepository;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;
    private final ControlPlaneAuditRecordRepository auditRecordRepository;
    private final GatewayConfigurationEventService configurationEventService;

    public RouteService(TenantContext tenantContext, ApiRouteRepository apiRouteRepository,
                        RouteConfigurationVersionRepository versionRepository, ObjectMapper objectMapper, AuditService auditService, ControlPlaneAuditRecordRepository auditRecordRepository, GatewayConfigurationEventService configurationEventService
    ) {
        this.tenantContext = tenantContext;
        this.apiRouteRepository = apiRouteRepository;
        this.versionRepository = versionRepository;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
        this.auditRecordRepository = auditRecordRepository;
        this.configurationEventService = configurationEventService;
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
        saveVersion(apiRoute, "CREATED");

        auditService.record(organization, "CREATE_ROUTE", "API_ROUTE",
                apiRoute.getRouteId(), startedAt,
                "Route configuration version 1 created");

        configurationEventService.publish("CREATED", organization.getId(), apiRoute.getRouteId(),
                apiRoute.getConfigurationVersion());

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

    @Transactional
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

        saveVersion(apiRoute, "UPDATED");

        auditService.record(organization, "UPDATE_ROUTE", "API_ROUTE",
                apiRoute.getRouteId(), startedAt,
                "Route configuration version " +
                        apiRoute.getConfigurationVersion() + " created");

        configurationEventService.publish("UPDATED", organization.getId(), apiRoute.getRouteId(),
                apiRoute.getConfigurationVersion());

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

        String changeType = routeStatusRequest.getActive() ? "ACTIVATED" : "DEACTIVATED";
        String action = routeStatusRequest.getActive() ? "ACTIVATE_ROUTE" : "DEACTIVATE_ROUTE";

        saveVersion(apiRoute, changeType);

        auditService.record(organization, action, "API_ROUTE", apiRoute.getRouteId(), startedAt,
                "Route configuration version " + apiRoute.getConfigurationVersion() + " created");

        configurationEventService.publish(changeType, organization.getId(), apiRoute.getRouteId(),
                apiRoute.getConfigurationVersion());

        return RouteResponse.from(apiRoute);
    }

    @Transactional
    public void delete(Long id) {
        long startedAt = System.nanoTime();

        Organization organization = tenantContext.getTenantOrganization();
        ApiRoute apiRoute = getTenantRoute(id, organization.getId());
        apiRoute.setConfigurationVersion(apiRoute.getConfigurationVersion() + 1);
        apiRoute.setUpdatedAt(LocalDateTime.now());

        saveVersion(apiRoute, "DELETED");

        auditService.record(organization, "DELETE_ROUTE", "API_ROUTE", apiRoute.getRouteId(), startedAt,
                "Final configuration saved as version " + apiRoute.getConfigurationVersion());

        apiRouteRepository.delete(apiRoute);

        configurationEventService.publish("DELETED", organization.getId(), apiRoute.getRouteId(),
                apiRoute.getConfigurationVersion());
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

        if (apiRoute.getRouteHeaderRules() == null) {
            apiRoute.setRouteHeaderRules(new ArrayList<>());
        }

        if(routeRequest.getHeaderRules() != null) {
            for(HeaderRuleRequest ruleRequest : routeRequest.getHeaderRules()) {
                RouteHeaderRule routeHeaderRule = new RouteHeaderRule();

                routeHeaderRule.setApiRoute(apiRoute);
                routeHeaderRule.setDirection(ruleRequest.getDirection().toUpperCase(Locale.ENGLISH));
                routeHeaderRule.setAction(ruleRequest.getAction());
                routeHeaderRule.setHeaderName(ruleRequest.getHeaderName());
                routeHeaderRule.setHeaderValue(ruleRequest.getHeaderValue());
                routeHeaderRule.setCreatedAt(LocalDateTime.now());
                routeHeaderRule.setUpdatedAt(LocalDateTime.now());

                apiRoute.getRouteHeaderRules().add(routeHeaderRule);
            }
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

            if(!"REQUEST".equals(direction) && !"RESPONSE".equals(direction)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "direction must be either REQUEST or RESPONSE");
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


    //GATEWAY METHODS
    @Transactional(readOnly = true)
    public List<RouteResponse> findAllActiveForGateway() {
        return toResponse(
                apiRouteRepository.findAllByActiveTrueAndOrganizationStatus(OrganizationStatus.ACTIVE));
    }

    private void saveVersion(ApiRoute apiRoute, String changeType) {
        RouteConfigurationVersion configurationVersion = new RouteConfigurationVersion();
        configurationVersion.setOrganization(apiRoute.getOrganization());
        configurationVersion.setRouteId(apiRoute.getRouteId());
        configurationVersion.setVersionNumber(apiRoute.getConfigurationVersion());
        configurationVersion.setChangeType(changeType);
        configurationVersion.setConfigurationSnapshot(
                objectMapper.writeValueAsString(RouteResponse.from(apiRoute)));
        configurationVersion.setCreatedAt(LocalDateTime.now());

        versionRepository.save(configurationVersion);
    }

    @Transactional(readOnly = true)
    public List<RouteVersionResponse> getVersions(String routeId) {
        Organization organization = tenantContext.getTenantOrganization();

        List<RouteVersionResponse> responses = new ArrayList<>();

        List<RouteConfigurationVersion> versions = versionRepository
                .findAllByOrganizationIdAndRouteIdOrderByVersionNumberDesc(organization.getId(), routeId);

        for(RouteConfigurationVersion version : versions) {
            responses.add(RouteVersionResponse.from(version));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public List<AuditRecordResponse> getAuditRecords() {
        Organization organization = tenantContext.getTenantOrganization();

        List<AuditRecordResponse> responses = new ArrayList<>();

        List<ControlPlaneAuditRecord> records = auditRecordRepository
                .findAllByOrganizationIdOrderByCreatedAtDesc(organization.getId());

        for (ControlPlaneAuditRecord record : records) {
            responses.add(AuditRecordResponse.from(record));
        }
        return responses;
    }
}

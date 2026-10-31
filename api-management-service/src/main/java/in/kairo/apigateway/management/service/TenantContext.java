package in.kairo.apigateway.management.service;

import in.kairo.apigateway.management.entity.Organization;
import in.kairo.apigateway.management.entity.OrganizationStatus;
import in.kairo.apigateway.management.exception.ApiException;
import in.kairo.apigateway.management.repository.OrganizationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class TenantContext {

    private final OrganizationRepository organizationRepository;

    public TenantContext(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    public Organization  getTenantOrganization() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if(!(authentication instanceof JwtAuthenticationToken)){
            throw new ApiException(HttpStatus.FORBIDDEN, "Tenant Authentication Error");
        }

        Long organizationId = ((JwtAuthenticationToken) authentication).getToken().getClaim("organizationId");

        if(organizationId == null){
            throw new ApiException(HttpStatus.FORBIDDEN, "Tenant Identity is missing");
        }

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant Organization not found"));

        if(organization.getStatus() != OrganizationStatus.ACTIVE){
            throw new ApiException(HttpStatus.FORBIDDEN, "Tenant Organization is not active");
        }
        return organization;
    }
}

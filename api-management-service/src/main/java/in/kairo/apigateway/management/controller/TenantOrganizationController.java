package in.kairo.apigateway.management.controller;

import in.kairo.apigateway.management.dto.requestDto.TenantOrganizationRequest;
import in.kairo.apigateway.management.dto.responseDto.OrganizationResponse;
import in.kairo.apigateway.management.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant/organization")
public class TenantOrganizationController {

    private final OrganizationService organizationService;

    public TenantOrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    public ResponseEntity<OrganizationResponse> getTenantOrganization() {
        return ResponseEntity.ok(organizationService.getTenantOrganization());
    }

    @PutMapping
    public ResponseEntity<OrganizationResponse> updateTenantOrganization(
            @Valid @RequestBody TenantOrganizationRequest tenantOrganizationRequest) {
        return ResponseEntity.ok(organizationService.updateTenantOrganization(tenantOrganizationRequest));
    }
}

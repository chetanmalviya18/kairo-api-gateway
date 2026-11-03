package in.kairo.apigateway.management.controller;

import in.kairo.apigateway.management.dto.requestDto.OrganizationRequest;
import in.kairo.apigateway.management.dto.requestDto.OrganizationStatusRequest;
import in.kairo.apigateway.management.dto.requestDto.TenantAdminRequest;
import in.kairo.apigateway.management.dto.requestDto.TenantAdminStatusRequest;
import in.kairo.apigateway.management.dto.responseDto.OrganizationResponse;
import in.kairo.apigateway.management.dto.responseDto.TenantAdminResponse;
import in.kairo.apigateway.management.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/platform/organization")
public class PlatformOrganizationController {

    private final OrganizationService organizationService;

    public PlatformOrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    // CRUD --> Organizations
    @PostMapping
    public ResponseEntity<OrganizationResponse> create(
            @Valid @RequestBody OrganizationRequest organizationRequest){
        return ResponseEntity.status(HttpStatus.CREATED).body(organizationService.create(organizationRequest));
    }

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> findAll(){
        return ResponseEntity.ok(organizationService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrganizationResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody OrganizationRequest organizationRequest) {
        return ResponseEntity.ok(organizationService.update(id, organizationRequest));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrganizationResponse> changeStatus(@PathVariable Long id,
                                                             @Valid @RequestBody
                                                             OrganizationStatusRequest organizationStatusRequest) {
        return ResponseEntity.ok(organizationService.changeStatus(id, organizationStatusRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        organizationService.delete(id);
        return ResponseEntity.noContent().build();
    }


    // CRUD --> TENANT ADMIN
    @PostMapping("/{organizationId}/tenant-admin")
    public ResponseEntity<TenantAdminResponse> createTenantAdmin(@PathVariable Long organizationId,
                                                                 @Valid @RequestBody TenantAdminRequest tenantAdminRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizationService.createTenantAdmin(organizationId, tenantAdminRequest));

    }

    @GetMapping("/{organizationId}/tenant-admin")
    public ResponseEntity<TenantAdminResponse> getTenantAdmin(@PathVariable Long organizationId) {
        return ResponseEntity.ok(organizationService.getTenantAdmin(organizationId));
    }

    @PutMapping("/{organizationId}/tenant-admin")
    public ResponseEntity<TenantAdminResponse> updateTenantAdmin(@PathVariable Long organizationId,
                                                                 @Valid @RequestBody TenantAdminRequest tenantAdminRequest) {
        return ResponseEntity.ok(organizationService.updateTenantAdmin(organizationId, tenantAdminRequest));
    }

    @PatchMapping("/{organizationId}/tenant-admin/{id}/status")
    public ResponseEntity<TenantAdminResponse> changeTenantStatus(@PathVariable Long organizationId,
                                                                  @PathVariable Long id,
                                                                  @Valid @RequestBody TenantAdminStatusRequest request) {
        return ResponseEntity.ok(organizationService.changeTenantStatus(organizationId, request));
    }

    @DeleteMapping("/{organizationId}/tenant-admin")
    public ResponseEntity<Void> deleteTenantAdmin(@PathVariable Long organizationId) {
        organizationService.deleteTenantAdmin(organizationId);
        return ResponseEntity.noContent().build();
    }
}

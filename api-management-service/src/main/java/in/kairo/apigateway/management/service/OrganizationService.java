package in.kairo.apigateway.management.service;

import in.kairo.apigateway.management.dto.requestDto.OrganizationRequest;
import in.kairo.apigateway.management.dto.requestDto.OrganizationStatusRequest;
import in.kairo.apigateway.management.dto.requestDto.TenantAdminRequest;
import in.kairo.apigateway.management.dto.requestDto.TenantOrganizationRequest;
import in.kairo.apigateway.management.dto.responseDto.OrganizationResponse;
import in.kairo.apigateway.management.dto.responseDto.TenantAdminResponse;
import in.kairo.apigateway.management.entity.ManagementUser;
import in.kairo.apigateway.management.entity.Organization;
import in.kairo.apigateway.management.entity.OrganizationStatus;
import in.kairo.apigateway.management.entity.Role;
import in.kairo.apigateway.management.exception.ApiException;
import in.kairo.apigateway.management.repository.ManagementUserRepository;
import in.kairo.apigateway.management.repository.OrganizationRepository;
import in.kairo.apigateway.management.repository.RoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final ManagementUserRepository managementUserRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantContext tenantContext;
    private final AuditService auditService;

    public OrganizationService(OrganizationRepository organizationRepository,
                               ManagementUserRepository managementUserRepository,
                               RoleRepository roleRepository, PasswordEncoder passwordEncoder,
                               TenantContext tenantContext, AuditService auditService) {
        this.organizationRepository = organizationRepository;
        this.managementUserRepository = managementUserRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tenantContext = tenantContext;
        this.auditService = auditService;
    }

    @Transactional
    public OrganizationResponse create(OrganizationRequest organizationRequest) {
        long startedAt = System.nanoTime();

        checkUnique(organizationRequest.getName(), organizationRequest.getSlug(), null);

        Organization organization = new Organization();
        organization.setName(organizationRequest.getName());
        organization.setSlug(organizationRequest.getSlug());
        organization.setStatus(OrganizationStatus.PENDING);
        organization.setCreatedAt(LocalDateTime.now());
        organization.setUpdatedAt(LocalDateTime.now());

        organizationRepository.save(organization);

        auditService.record(organization, "CREATE_ORGANIZATION", "ORGANIZATION",
                organization.getId().toString(), startedAt, "Organization created in PENDING status");

        return OrganizationResponse.from(organization);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> findAll() {
        List<OrganizationResponse> organizations = new ArrayList<>();

        for (Organization organization : organizationRepository.findAllByStatusNot(OrganizationStatus.DELETED)) {
            organizations.add(OrganizationResponse.from(organization));
        }

        return organizations;
    }

    @Transactional(readOnly = true)
    public OrganizationResponse findById(Long id) {
        return OrganizationResponse.from(getOrganization(id));
    }

    @Transactional
    public OrganizationResponse update(Long id, OrganizationRequest organizationRequest) {
        long startedAt = System.nanoTime();

        Organization organization = getOrganization(id);
        checkUnique(organizationRequest.getName(), organizationRequest.getSlug(), id);
        organization.setName(organizationRequest.getName());
        organization.setSlug(organizationRequest.getSlug());
        organization.setUpdatedAt(LocalDateTime.now());

        auditService.record(organization, "UPDATE_ORGANIZATION", "ORGANIZATION",
                id.toString(), startedAt, "Organization name and slug updated");

        return OrganizationResponse.from(organization);
    }

    @Transactional
    public OrganizationResponse changeStatus(Long id, OrganizationStatusRequest organizationStatusRequest) {
        long startedAt = System.nanoTime();

        Organization organization = getOrganization(id);

        if(organizationStatusRequest.getStatus() == OrganizationStatus.DELETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use DELETE to soft-delete an organization");
        }

        organization.setStatus(organizationStatusRequest.getStatus());
        organization.setUpdatedAt(LocalDateTime.now());

        auditService.record(organization, "CHANGE_ORGANIZATION_STATUS",
                "ORGANIZATION", id.toString(),
                startedAt, "Organization status changed to " + organizationStatusRequest.getStatus());

        return OrganizationResponse.from(organization);
    }

    @Transactional
    public void delete(Long id) {
        long  startedAt = System.nanoTime();
        Organization organization = getOrganization(id);

        organization.setStatus(OrganizationStatus.DELETED);
        organization.setDeletedAt(LocalDateTime.now());
        organization.setUpdatedAt(LocalDateTime.now());

        auditService.record(organization, "DELETE_ORGANIZATION", "ORGANIZATION",
               id.toString(), startedAt, "Organization softly deleted");
    }

    @Transactional
    public TenantAdminResponse createTenantAdmin(Long organizationId, TenantAdminRequest tenantAdminRequest) {
        long startedAt = System.nanoTime();
        Organization organization = getOrganization(organizationId);

        if(managementUserRepository.findByOrganizationId(organizationId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "This organization already has a tenant admin");
        }

        if(managementUserRepository.existsByUsername(tenantAdminRequest.getUsername())) {
            throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
        }

        Role role = roleRepository.findByName("TENANT_ADMIN")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "TENANT_ADMIN role not found"));

        ManagementUser user = new ManagementUser();
        user.setOrganization(organization);
        user.setRole(role);
        user.setUsername(tenantAdminRequest.getUsername());
        user.setPasswordHash(passwordEncoder.encode(tenantAdminRequest.getPassword()));
        user.setEnabled(tenantAdminRequest.isEnabled());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        managementUserRepository.save(user);

        auditService.record(organization, "CREATE_TENANT_ADMIN", "MANAGEMENT_USER",
                user.getId().toString(), startedAt, "Tenant administrator created");

        return TenantAdminResponse.from(user);
    }

    @Transactional(readOnly = true)
    public TenantAdminResponse getTenantAdmin(Long organizationId) {
        return TenantAdminResponse.from(getTenantAdminEntity(organizationId));
    }

    @Transactional
    public TenantAdminResponse updateTenantAdmin(Long organizationId, TenantAdminRequest tenantAdminRequest) {
        long startedAt = System.nanoTime();
        ManagementUser user = getTenantAdminEntity(organizationId);

        if (!user.getUsername().equals(tenantAdminRequest.getUsername())
                && managementUserRepository.existsByUsername(tenantAdminRequest.getUsername())){
            throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
        }

        user.setUsername(tenantAdminRequest.getUsername());
        user.setPasswordHash(passwordEncoder.encode(tenantAdminRequest.getPassword()));
        user.setEnabled(tenantAdminRequest.isEnabled());
        user.setUpdatedAt(LocalDateTime.now());

        auditService.record(user.getOrganization(), "UPDATE_TENANT_ADMIN", "MANAGEMENT_USER",
                user.getOrganization().getId().toString(), startedAt,
                "Tenant administrator updated");

        return TenantAdminResponse.from(user);
    }

    @Transactional
    public void deleteTenantAdmin(Long organizationId) {
        long startedAt = System.nanoTime();
        ManagementUser user = getTenantAdminEntity(organizationId);
        managementUserRepository.delete(user);

        auditService.record(user.getOrganization(), "DELETE_TENANT_ADMIN", "MANAGEMENT_USER",
                user.getOrganization().getId().toString(), startedAt,
                "Tenant administrator deleted");
    }


    private ManagementUser getTenantAdminEntity(Long organizationId) {
        getOrganization(organizationId);
        return managementUserRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant admin not found"));
    }

    private Organization getOrganization(Long id){
        return organizationRepository.findByIdAndStatusNot(id, OrganizationStatus.DELETED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Organization not found"));
    }

    private void checkUnique(String name, String slug, Long currentId) {
        if(organizationRepository.existsByNameIgnoreCase(name)) {
            Organization current = currentId == null ?
                    null : organizationRepository.findById(currentId).orElse(null);

            if(current == null || !current.getName().equalsIgnoreCase(name)) {
                throw new ApiException(HttpStatus.CONFLICT, "Organization name already exists");
            }
        }

        if(organizationRepository.existsBySlugIgnoreCase(slug)) {
            Organization current = currentId == null ?
                    null : organizationRepository.findById(currentId).orElse(null);

            if(current == null || !current.getSlug().equalsIgnoreCase(slug)) {
                throw new ApiException(HttpStatus.CONFLICT, "Organization slug is already exists");
            }
        }
    }

    // Methods for Tenant Admin
    @Transactional(readOnly = true)
    public OrganizationResponse getTenantOrganization(){
        return OrganizationResponse.from(tenantContext.getTenantOrganization());
    }

    @Transactional
    public OrganizationResponse updateTenantOrganization(TenantOrganizationRequest tenantOrganizationRequest) {
        long startedAt = System.nanoTime();

        Organization organization = tenantContext.getTenantOrganization();

        if(!organization.getName().equalsIgnoreCase(tenantOrganizationRequest.getName()) &&
            organizationRepository.existsByNameIgnoreCase(tenantOrganizationRequest.getName())) {
            throw new ApiException(HttpStatus.CONFLICT, "Organization name already exists");
        }

        organization.setName(tenantOrganizationRequest.getName());
        organization.setUpdatedAt(LocalDateTime.now());

        auditService.record(organization, "UPDATE_OWN_ORGANIZATION", "ORGANIZATION",
                organization.getId().toString(), startedAt,
                "Tenant updated its organization name");

        return OrganizationResponse.from(organization);
    }
}

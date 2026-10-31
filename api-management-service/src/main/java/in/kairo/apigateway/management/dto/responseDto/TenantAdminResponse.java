package in.kairo.apigateway.management.dto.responseDto;

import in.kairo.apigateway.management.entity.ManagementUser;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TenantAdminResponse {
    private Long id;
    private Long organizationId;
    private String username;
    private boolean enabled;

    public static TenantAdminResponse from(ManagementUser  managementUser) {
        return new TenantAdminResponse(
                managementUser.getId(),
                managementUser.getOrganization().getId(),
                managementUser.getUsername(),
                managementUser.isEnabled()
        );
    }
}

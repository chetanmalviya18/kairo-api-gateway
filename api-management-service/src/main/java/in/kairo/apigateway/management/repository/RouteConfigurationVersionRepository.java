package in.kairo.apigateway.management.repository;

import in.kairo.apigateway.management.entity.Organization;
import in.kairo.apigateway.management.entity.RouteConfigurationVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteConfigurationVersionRepository extends JpaRepository<RouteConfigurationVersion, Long> {
    List<RouteConfigurationVersion>
    findAllByOrganizationIdAndRouteIdOrderByVersionNumberDesc(Long organizationId, String routeId);
}

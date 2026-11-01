package in.kairo.apigateway.management.repository;

import in.kairo.apigateway.management.entity.ApiRoute;
import in.kairo.apigateway.management.entity.OrganizationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiRouteRepository extends JpaRepository<ApiRoute, Long> {
    boolean existsByOrganizationIdAndRouteId(Long organizationId, String routeId);

    List<ApiRoute> findAllByOrganizationId(Long id);

    Optional<ApiRoute> findByIdAndOrganizationId(Long id, Long organizationId);

    List<ApiRoute> findAllByActiveTrueAndOrganizationStatus(OrganizationStatus status);
}



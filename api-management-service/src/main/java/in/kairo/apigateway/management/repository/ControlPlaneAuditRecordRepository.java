package in.kairo.apigateway.management.repository;

import in.kairo.apigateway.management.entity.ControlPlaneAuditRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ControlPlaneAuditRecordRepository extends JpaRepository<ControlPlaneAuditRecord, Long> {
    List<ControlPlaneAuditRecord> findAllByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}

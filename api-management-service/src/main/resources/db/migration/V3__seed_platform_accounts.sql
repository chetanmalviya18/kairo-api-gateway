INSERT INTO management_users(
    organization_id, role_id, username, password_hash, enabled, created_at, updated_at
)
SELECT NULL, roles.id, 'platform_admin',
       '$2a$12$rAvadnOzDhhMUwDr4p81GuzHp47Q8MHgji1JWVE1qyJB/RAm.0ZOS',
       TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM roles WHERE roles.name = 'PLATFORM_ADMIN';


INSERT INTO management_users (
    organization_id, role_id, username, password_hash, enabled, created_at, updated_at
)
SELECT NULL, roles.id, 'gateway_service',
         '$2a$12$rAvadnOzDhhMUwDr4p81GuzHp47Q8MHgji1JWVE1qyJB/RAm.0ZOS',
         TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM roles WHERE roles.name = 'GATEWAY_SERVICE';
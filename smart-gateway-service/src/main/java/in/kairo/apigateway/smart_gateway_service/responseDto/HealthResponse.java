package in.kairo.apigateway.smart_gateway_service.responseDto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class HealthResponse {
    private String serviceName;
    private String serviceDescription;
    private String serviceStatus;
}

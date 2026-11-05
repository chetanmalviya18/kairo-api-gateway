package in.kairo.apigateway.smart_gateway_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HeaderRule {
    private Long id;
    private String direction;
    private String action;
    private String header_name;
    private String header_value;
}

package in.kairo.apigateway.management.dto.responseDto;

import in.kairo.apigateway.management.entity.RouteHeaderRule;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HeaderRuleResponse {
    private Long id;
    private String direction;
    private String action;
    private String header_name;
    private String header_value;

    public static HeaderRuleResponse from(RouteHeaderRule routeHeaderRule) {
        return new HeaderRuleResponse(
                routeHeaderRule.getId(),
                routeHeaderRule.getDirection(),
                routeHeaderRule.getAction(),
                routeHeaderRule.getHeaderName(),
                routeHeaderRule.getHeaderValue()
        );
    }
}

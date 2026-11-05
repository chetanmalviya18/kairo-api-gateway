package in.kairo.apigateway.smart_gateway_service.service;

import in.kairo.apigateway.smart_gateway_service.client.ManagementApiClient;
import in.kairo.apigateway.smart_gateway_service.dto.GatewayRoute;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GatewayConfigurationLoader implements ApplicationRunner {

    private final ManagementApiClient  managementApiClient;

    public GatewayConfigurationLoader(ManagementApiClient managementApiClient) {
        this.managementApiClient = managementApiClient;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        refresh();
    }

    public void refresh() {
        List<GatewayRoute> routes = managementApiClient.fetchActiveRoutes();

        for (GatewayRoute route : routes) {
            System.out.println("Route: " + route.getTargetPathPrefix());
        }
    }
}

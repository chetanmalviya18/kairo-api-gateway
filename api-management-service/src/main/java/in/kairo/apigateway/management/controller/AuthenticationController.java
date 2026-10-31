package in.kairo.apigateway.management.controller;

import in.kairo.apigateway.management.dto.requestDto.LoginRequest;
import in.kairo.apigateway.management.dto.responseDto.LoginResponse;
import in.kairo.apigateway.management.service.AuthenticationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService){
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest){
        return ResponseEntity.ok(authenticationService.login(loginRequest));
    }
}

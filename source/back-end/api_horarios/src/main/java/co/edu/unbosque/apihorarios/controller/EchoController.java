package co.edu.unbosque.apihorarios.controller;

import co.edu.unbosque.apihorarios.model.EchoResponse;
import co.edu.unbosque.apihorarios.service.EchoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class EchoController {

    private final EchoService echoService;

    public EchoController(EchoService echoService) {
        this.echoService = echoService;
    }

    @GetMapping({"/echo", "/api/echo"})
    public ResponseEntity<EchoResponse> echo() {
        EchoResponse response = echoService.checkDatabaseConnection();
        if (response.isDatabaseConnected()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }
}

package co.edu.unbosque.apihorarios.service;

import co.edu.unbosque.apihorarios.model.EchoResponse;
import co.edu.unbosque.apihorarios.repository.DatabaseCheckRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.time.LocalDateTime;

@Service
public class EchoService {

    private final DatabaseCheckRepository databaseCheckRepository;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    public EchoService(DatabaseCheckRepository databaseCheckRepository) {
        this.databaseCheckRepository = databaseCheckRepository;
    }

    public EchoResponse checkDatabaseConnection() {
        try {
            String details = databaseCheckRepository.verifyConnection();
            return new EchoResponse(
                    "OK",
                    true,
                    details,
                    datasourceUrl,
                    LocalDateTime.now()
            );
        } catch (SQLException e) {
            return new EchoResponse(
                    "ERROR",
                    false,
                    "Error al conectar con la base de datos: " + e.getMessage(),
                    datasourceUrl,
                    LocalDateTime.now()
            );
        }
    }
}

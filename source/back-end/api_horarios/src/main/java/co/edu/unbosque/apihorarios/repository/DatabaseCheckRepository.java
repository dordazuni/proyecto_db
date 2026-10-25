package co.edu.unbosque.apihorarios.repository;

import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@Repository
public class DatabaseCheckRepository {

    private final DataSource dataSource;

    public DatabaseCheckRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public String verifyConnection() throws SQLException {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("SELECT current_database(), version()");
             ResultSet resultSet = statement.executeQuery()) {
            if (resultSet.next()) {
                String dbName = resultSet.getString(1);
                String dbVersion = resultSet.getString(2);
                return "Conexión exitosa a la base de datos '" + dbName + "' (" + dbVersion + ")";
            }
            return "Conexión exitosa a la base de datos";
        }
    }
}

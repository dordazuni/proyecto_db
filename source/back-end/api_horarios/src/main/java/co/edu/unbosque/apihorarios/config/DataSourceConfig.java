package co.edu.unbosque.apihorarios.config;

import co.edu.unbosque.apihorarios.model.Usuario;
import co.edu.unbosque.apihorarios.security.AuthContextHolder;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.Map;
import java.util.logging.Logger;

@Configuration
public class DataSourceConfig {

    private final HikariDataSource adminDataSource;
    private final HikariDataSource coordinadorDataSource;
    private final HikariDataSource aprobadorDataSource;
    private final HikariDataSource docenteDataSource;

    public DataSourceConfig(
            @Value("${spring.datasource.url}") String jdbcUrl,
            @Value("${spring.datasource.password:}") String defaultPassword,
            @Value("${sigh.db.user.admin:app_administrador}") String adminUser,
            @Value("${sigh.db.password.admin:${spring.datasource.password:}}") String adminPass,
            @Value("${sigh.db.user.coordinador:app_coordinador}") String coordUser,
            @Value("${sigh.db.password.coordinador:${spring.datasource.password:}}") String coordPass,
            @Value("${sigh.db.user.aprobador:app_aprobador}") String aprobUser,
            @Value("${sigh.db.password.aprobador:${spring.datasource.password:}}") String aprobPass,
            @Value("${sigh.db.user.docente:app_docente}") String docenteUser,
            @Value("${sigh.db.password.docente:${spring.datasource.password:}}") String docentePass
    ) {
        this.adminDataSource = createPool("sigh-pool-admin", jdbcUrl, adminUser,
                adminPass != null && !adminPass.isEmpty() ? adminPass : defaultPassword);
        this.coordinadorDataSource = createPool("sigh-pool-coordinador", jdbcUrl, coordUser,
                coordPass != null && !coordPass.isEmpty() ? coordPass : defaultPassword);
        this.aprobadorDataSource = createPool("sigh-pool-aprobador", jdbcUrl, aprobUser,
                aprobPass != null && !aprobPass.isEmpty() ? aprobPass : defaultPassword);
        this.docenteDataSource = createPool("sigh-pool-docente", jdbcUrl, docenteUser,
                docentePass != null && !docentePass.isEmpty() ? docentePass : defaultPassword);
    }

    private HikariDataSource createPool(String poolName, String jdbcUrl, String username, String password) {
        if ("postgres".equalsIgnoreCase(username) || "sigh_owner".equalsIgnoreCase(username)) {
            throw new IllegalStateException("RNF-04: La aplicación nunca debe conectarse como '" + username + "'");
        }
        HikariConfig config = new HikariConfig();
        config.setPoolName(poolName);
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password != null ? password : "");
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(4);
        config.setMinimumIdle(1);
        config.setInitializationFailTimeout(-1);
        return new HikariDataSource(config);
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        Map<String, DataSource> poolsByRole = Map.of(
                "ADMINISTRADOR", adminDataSource,
                "COORDINADOR", coordinadorDataSource,
                "APROBADOR", aprobadorDataSource,
                "DOCENTE", docenteDataSource
        );

        return new RoleAwareDataSource(poolsByRole, coordinadorDataSource);
    }

    @PreDestroy
    public void closePools() {
        adminDataSource.close();
        coordinadorDataSource.close();
        aprobadorDataSource.close();
        docenteDataSource.close();
    }

    /**
     * RNF-04 y RF-24: Enruta cada petición al DataSource del rol del token (app_*)
     * y ejecuta SELECT set_config('app.id_usuario', '<id>', true) dentro de la misma
     * transacción (tanto en lecturas como en escrituras).
     */
    private static class RoleAwareDataSource implements DataSource {

        private final Map<String, DataSource> poolsByRole;
        private final DataSource authLookupDataSource;

        RoleAwareDataSource(Map<String, DataSource> poolsByRole, DataSource authLookupDataSource) {
            this.poolsByRole = poolsByRole;
            this.authLookupDataSource = authLookupDataSource;
        }

        private DataSource resolveTargetDataSource() {
            if (AuthContextHolder.isForceAuthLookup()) {
                return authLookupDataSource;
            }
            Usuario currentUser = AuthContextHolder.getCurrentUser();
            if (currentUser != null && currentUser.getNombreRol() != null) {
                String roleKey = currentUser.getNombreRol().trim().toUpperCase();
                return poolsByRole.getOrDefault(roleKey, authLookupDataSource);
            }
            return authLookupDataSource;
        }

        @Override
        public Connection getConnection() throws SQLException {
            Connection rawConn = resolveTargetDataSource().getConnection();
            Usuario currentUser = AuthContextHolder.getCurrentUser();

            if (currentUser != null && currentUser.getIdUsuario() != null && !AuthContextHolder.isForceAuthLookup()) {
                try {
                    rawConn.setAutoCommit(false);
                    try (PreparedStatement ps = rawConn.prepareStatement("SELECT set_config('app.id_usuario', ?, true)")) {
                        ps.setString(1, String.valueOf(currentUser.getIdUsuario()));
                        ps.executeQuery();
                    }
                } catch (SQLException ex) {
                    try {
                        rawConn.rollback();
                        rawConn.setAutoCommit(true);
                    } catch (SQLException ignored) {
                    }
                    rawConn.close();
                    throw ex;
                }
                return wrapTransactionalConnection(rawConn);
            }

            return rawConn;
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            return getConnection();
        }

        private Connection wrapTransactionalConnection(Connection rawConn) {
            return (Connection) Proxy.newProxyInstance(
                    Connection.class.getClassLoader(),
                    new Class<?>[]{Connection.class},
                    (proxy, method, args) -> {
                        String name = method.getName();
                        if ("setAutoCommit".equals(name) && args != null && args.length == 1 && Boolean.TRUE.equals(args[0])) {
                            finishTransactionSafely(rawConn);
                            return null;
                        }
                        if ("close".equals(name)) {
                            try {
                                finishTransactionSafely(rawConn);
                            } finally {
                                rawConn.close();
                            }
                            return null;
                        }
                        try {
                            return method.invoke(rawConn, args);
                        } catch (InvocationTargetException ex) {
                            throw ex.getTargetException();
                        }
                    }
            );
        }

        private void finishTransactionSafely(Connection rawConn) {
            try {
                if (!rawConn.isClosed() && !rawConn.getAutoCommit()) {
                    try {
                        rawConn.commit();
                    } catch (SQLException commitEx) {
                        try {
                            rawConn.rollback();
                        } catch (SQLException ignored) {
                        }
                    }
                    try {
                        rawConn.setAutoCommit(true);
                    } catch (SQLException ignored) {
                    }
                }
            } catch (SQLException ignored) {
            }
        }

        @Override
        public PrintWriter getLogWriter() throws SQLException {
            return resolveTargetDataSource().getLogWriter();
        }

        @Override
        public void setLogWriter(PrintWriter out) throws SQLException {
            resolveTargetDataSource().setLogWriter(out);
        }

        @Override
        public void setLoginTimeout(int seconds) throws SQLException {
            resolveTargetDataSource().setLoginTimeout(seconds);
        }

        @Override
        public int getLoginTimeout() throws SQLException {
            return resolveTargetDataSource().getLoginTimeout();
        }

        @Override
        public Logger getParentLogger() throws SQLFeatureNotSupportedException {
            return resolveTargetDataSource().getParentLogger();
        }

        @Override
        public <T> T unwrap(Class<T> iface) throws SQLException {
            return resolveTargetDataSource().unwrap(iface);
        }

        @Override
        public boolean isWrapperFor(Class<?> iface) throws SQLException {
            return resolveTargetDataSource().isWrapperFor(iface);
        }
    }
}

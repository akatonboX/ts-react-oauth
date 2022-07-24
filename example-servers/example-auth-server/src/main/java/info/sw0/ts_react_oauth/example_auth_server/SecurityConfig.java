package info.sw0.ts_react_oauth.example_auth_server;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.function.Supplier;

import org.springframework.context.annotation.Bean;

@EnableWebSecurity()
public class SecurityConfig {

  @Bean
  SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
    http.authorizeRequests(authorizeRequests -> authorizeRequests.anyRequest().authenticated())
      .formLogin(Customizer.withDefaults());
      http.logout(logout-> logout.logoutUrl("/logout"));
      http.csrf().disable();
      http.cors().configurationSource(
        ((Supplier<CorsConfigurationSource >) () -> {
          var corsConfiguration = new CorsConfiguration();
          corsConfiguration.addAllowedOrigin("http://127.0.0.1:3000");
          corsConfiguration.addAllowedOrigin("http://localhost:3000");
          corsConfiguration.addAllowedHeader(CorsConfiguration.ALL);
          corsConfiguration.addAllowedMethod(CorsConfiguration.ALL);
          corsConfiguration.setAllowCredentials(true);
          var corsSource = new UrlBasedCorsConfigurationSource();
          corsSource.registerCorsConfiguration("/**", corsConfiguration);
          return corsSource;
        }).get()
      );
    return http.build();
  }

  @Bean
  UserDetailsService users() {
    return new InMemoryUserDetailsManager(new UserDetails[] {
      User.withDefaultPasswordEncoder().username("user1").password("password").roles("USER").build(),
      User.withDefaultPasswordEncoder().username("user2").password("password").roles("USER", "read").build(),
      User.withDefaultPasswordEncoder().username("user3").password("password").roles("USER", "write").build()
    });
  }
}
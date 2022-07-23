package info.sw0.ts_react_oauth.example_auth_server;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.context.annotation.Bean;

@EnableWebSecurity()
public class SecurityConfig {

  @Bean
  SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
    http.authorizeRequests(authorizeRequests -> authorizeRequests.anyRequest().authenticated())
      .formLogin(Customizer.withDefaults());
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
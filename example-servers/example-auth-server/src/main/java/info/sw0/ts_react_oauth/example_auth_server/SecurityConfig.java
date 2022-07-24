package info.sw0.ts_react_oauth.example_auth_server;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.extern.slf4j.Slf4j;

import java.util.function.Supplier;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;

@Slf4j
@EnableWebSecurity()
public class SecurityConfig {

  @Bean
  SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
    http.authorizeRequests(authorizeRequests -> authorizeRequests.anyRequest().authenticated())
      .formLogin(Customizer.withDefaults());
      http.logout(logout-> logout.logoutUrl("/logout").addLogoutHandler(new LogoutHandler(){
        @Override
        public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {

          var attrributeNames = request.getSession().getAttributeNames();
          while(attrributeNames.hasMoreElements()){
            var name = attrributeNames.nextElement();
            var value = request.getSession().getAttribute(name);
            log.info("name={}, value={}", name, value);
            
          }
        }
      }));
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
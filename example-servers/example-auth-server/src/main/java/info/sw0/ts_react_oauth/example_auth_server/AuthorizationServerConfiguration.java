package info.sw0.ts_react_oauth.example_auth_server;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.ProviderSettings;
import org.springframework.security.oauth2.server.authorization.config.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.web.SecurityFilterChain;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration(proxyBeanMethods = false)
public class AuthorizationServerConfiguration  {
  @Bean
  @Order(Ordered.HIGHEST_PRECEDENCE)
  public SecurityFilterChain authServerSecurityFilterChain(HttpSecurity http) throws Exception {
      OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
      return http.formLogin(Customizer.withDefaults()).build();
  }

  @Bean
  public RegisteredClientRepository registeredClientRepository() {
    RegisteredClient registeredClient = RegisteredClient.withId(UUID.randomUUID().toString())
      .clientId("example")
      .clientSecret("{noop}secret")
      .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
      .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
      .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
      .redirectUri("http://127.0.0.1:8080/authorized")
      .scope(OidcScopes.OPENID)
      .scope(OidcScopes.EMAIL)
      .scope(OidcScopes.PROFILE)
      .tokenSettings(TokenSettings.builder()
        .refreshTokenTimeToLive(Duration.ofDays(6))
        .reuseRefreshTokens(true).build())
      .build();

    return new InMemoryRegisteredClientRepository(registeredClient);
  }

  @Bean
  public JWKSource<SecurityContext> jwkSource() {
    RSAKey rsaKey = generateRsa();
    JWKSet jwkSet = new JWKSet(rsaKey);
    return (jwkSelector, securityContext) -> jwkSelector.select(jwkSet);
  }

  private static RSAKey generateRsa() {
    KeyPair keyPair = generateRsaKey();
    RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
    RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
    return new RSAKey.Builder(publicKey)
      .privateKey(privateKey)
      .keyID(UUID.randomUUID().toString())
      .build();
  }

  private static KeyPair generateRsaKey() {
    KeyPair keyPair;
    try {
      KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
      keyPairGenerator.initialize(2048);
      keyPair = keyPairGenerator.generateKeyPair();
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
    return keyPair;
  }

  @Bean
  public ProviderSettings providerSettings() {
    return ProviderSettings.builder()
      .issuer("http://localhost:9000")
      .build();
  }

  /** UserDtailの"ROLE_USER"を除いて、scopeに追加 */
  @Bean 
	public OAuth2TokenCustomizer<JwtEncodingContext> tokenCustomizer(UserDetailsService userDtailesService) {
		return (context) -> {
			if ("access_token".equals(context.getTokenType().getValue())) {
				context.getClaims().claims(claims -> {
          var user = userDtailesService.loadUserByUsername(claims.get("sub").toString());
          var newScopes = user.getAuthorities().stream().map(authority -> authority.getAuthority().substring(5)).filter(authority -> !authority.equals("USER")).collect(Collectors.toSet());
          var originalScopes = Optional.ofNullable((Set<String>)claims.get("scope")).orElseGet(() -> Set.of());
          newScopes.addAll(originalScopes);
          claims.put("scope", Collections.unmodifiableSet(newScopes));
        });
			}
		};
  }

}
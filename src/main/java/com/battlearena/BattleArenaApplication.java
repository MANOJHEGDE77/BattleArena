package com.battlearena;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Battle Arena backend service.
 *
 * @SpringBootApplication encapsulates:
 * - @Configuration: Tags the class as a source of bean definitions.
 * - @EnableAutoConfiguration: Tells Spring Boot to configure beans based on classpath settings.
 * - @ComponentScan: Scans for other components, configurations, and services in this package and sub-packages.
 */
@SpringBootApplication
public class BattleArenaApplication {

    public static void main(String[] args) {
        SpringApplication.run(BattleArenaApplication.class, args);
    }
}

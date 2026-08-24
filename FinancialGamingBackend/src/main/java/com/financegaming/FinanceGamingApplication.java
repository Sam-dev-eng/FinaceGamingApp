package com.financegaming;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FinanceGamingApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinanceGamingApplication.class, args);
    }
}

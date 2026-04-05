package com.homekeep;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HomeKeepApplication {

    public static void main(String[] args) {
        SpringApplication.run(HomeKeepApplication.class, args);
    }
}

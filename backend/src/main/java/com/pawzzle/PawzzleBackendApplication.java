package com.pawzzle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class PawzzleBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(PawzzleBackendApplication.class, args);
	}
}

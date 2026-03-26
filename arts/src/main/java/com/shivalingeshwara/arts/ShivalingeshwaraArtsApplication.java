package com.shivalingeshwara.arts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShivalingeshwaraArtsApplication {

        @SuppressWarnings({"CallToPrintStackTrace", "UseSpecificCatch"})
	public static void main(String[] args) {
		SpringApplication.run(ShivalingeshwaraArtsApplication.class, args);
	

	    // Auto open browser
        // try {
        //     Thread.sleep(5000); // wait for server to start
        //     Runtime.getRuntime().exec("rundll32 url.dll,FileProtocolHandler http://localhost:8080");
        // } catch (Exception e) {
        //     e.printStackTrace();
        // }
	}
}
 
package com.shivalingeshwara.arts.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // ✅ Expose C:/shivalingeshwara-arts/uploads to the web
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:C:/shivalingeshwara-arts/uploads/");
    }
}

package com.shivalingeshwara.arts.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RoleInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        HttpSession session = request.getSession(false);

        if(session == null){
            response.sendRedirect("/");
            return false;
        }

        String role = (String) session.getAttribute("role");

        if(role == null){
            response.sendRedirect("/");
            return false;
        }

        String path = request.getRequestURI();

        // SUPER ADMIN ONLY ROUTES
        if(path.startsWith("/order/create")){

            if(!role.equals("SUPER_ADMIN")){
                response.sendRedirect("/order");
                return false;
            }

        }

        return true;
    }
}
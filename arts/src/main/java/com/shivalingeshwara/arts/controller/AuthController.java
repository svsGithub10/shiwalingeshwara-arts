package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.DeviceSession;
import com.shivalingeshwara.arts.model.User;
import com.shivalingeshwara.arts.repository.DeviceSessionRepository;
import com.shivalingeshwara.arts.repository.UserRepository;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeviceSessionRepository deviceSessionRepository;


    // CHECK EMAIL
    @PostMapping("/check-email")
    public Map<String, Object> checkEmail(@RequestBody Map<String,String> req){

        String email = req.get("email");

        Optional<User> user = userRepository.findByEmail(email);

        Map<String,Object> res = new HashMap<>();

        if(user.isPresent()){

            res.put("exists", true);
            res.put("role", user.get().getRole());

        }else{

            res.put("exists", false);

        }

        return res;
    }


    // LOGIN
@PostMapping("/login")
public Map<String,Object> login(@RequestBody Map<String,String> req,
                                HttpSession session,
                                HttpServletResponse response){

    String email = req.get("email");
    String password = req.get("password");
    String rememberMe = req.get("rememberMe"); // 👈 NEW

    Optional<User> userOpt = userRepository.findByEmail(email);

    Map<String,Object> res = new HashMap<>();

    if(userOpt.isPresent()){

        User user = userOpt.get();

        if(password.equals(user.getPassword())){

            // ✅ SESSION
            session.setAttribute("userId", user.getId());
            session.setAttribute("role", user.getRole());
            session.setAttribute("name", user.getName());

            // ✅ REMEMBER DEVICE
            if("true".equals(rememberMe)){

                String token = UUID.randomUUID().toString();

                DeviceSession ds = new DeviceSession();
                ds.setUserId(user.getId());
                ds.setToken(token);
                ds.setExpiry(LocalDateTime.now().plusDays(7));

                deviceSessionRepository.save(ds);

                Cookie cookie = new Cookie("DEVICE_TOKEN", token);
                cookie.setHttpOnly(true);
                cookie.setPath("/");
                cookie.setMaxAge(3650 * 24 * 60 * 60);

                response.addCookie(cookie);
            }

            res.put("success", true);

        }else{
            res.put("success", false);
        }

    }else{
        res.put("success", false);
    }

    return res;
}

@GetMapping("/session")
public Map<String,Object> sessionInfo(HttpSession session,
                                      HttpServletRequest request){

    Map<String,Object> res = new HashMap<>();

    // ✅ already logged in
    if(session.getAttribute("userId") != null){
        res.put("userId", session.getAttribute("userId"));
        res.put("role", session.getAttribute("role"));
        res.put("name", session.getAttribute("name"));
        return res;
    }

    // 🔥 AUTO LOGIN USING COOKIE
    if(request.getCookies() != null){

        for(Cookie c : request.getCookies()){

            if("DEVICE_TOKEN".equals(c.getName())){

                DeviceSession ds = deviceSessionRepository.findByToken(c.getValue());

                if(ds != null && ds.getExpiry().isAfter(LocalDateTime.now())){

                    Optional<User> userOpt = userRepository.findById(ds.getUserId());

                    if(userOpt.isPresent()){

                        User user = userOpt.get();

                        session.setAttribute("userId", user.getId());
                        session.setAttribute("role", user.getRole());
                        session.setAttribute("name", user.getName());

                        res.put("userId", user.getId());
                        res.put("role", user.getRole());
                        res.put("name", user.getName());

                        return res;
                    }
                }
            }
        }
    }

    return res;
}


    // LOGOUT
@PostMapping("/logout")
public void logout(HttpSession session,
                   HttpServletResponse response){

    session.invalidate();

    Cookie cookie = new Cookie("DEVICE_TOKEN", null);
    cookie.setMaxAge(0);
    cookie.setPath("/");

    response.addCookie(cookie);
}
}
package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.User;
import com.shivalingeshwara.arts.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;


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
                                    HttpSession session){

        String email = req.get("email");
        String password = req.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);

        Map<String,Object> res = new HashMap<>();

        if(userOpt.isPresent()){

            User user = userOpt.get();

            if(password.equals(user.getPassword())){

                session.setAttribute("userId", user.getId());
                session.setAttribute("role", user.getRole());
                session.setAttribute("name", user.getName());

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
public Map<String,Object> sessionInfo(HttpSession session){

    Map<String,Object> res = new HashMap<>();

    res.put("userId", session.getAttribute("userId"));
    res.put("role", session.getAttribute("role"));
    res.put("name", session.getAttribute("name"));

    return res;
}


    // LOGOUT
    @PostMapping("/logout")
    public void logout(HttpSession session){

        session.invalidate();

    }
}
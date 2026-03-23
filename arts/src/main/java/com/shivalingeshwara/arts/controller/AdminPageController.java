package com.shivalingeshwara.arts.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminPageController {

    @GetMapping("/order")
    public String adminPage(){
        return "order";
    }

    @GetMapping("/admin/dashboard")
    public String dashboard(){
        return "admin/dashboard";
    }

    @GetMapping("/admin/orders")
    public String orders(){
        return "admin/orders";
    }

    @GetMapping("/admin/materials")
    public String materials(){
        return "admin/materials";
    }

    @GetMapping("/admin/finance")
    public String finance(){
        return "admin/finance";
    }

    @GetMapping("/admin/expenses")
    public String expenses(){
        return "admin/expenses";
    }

}
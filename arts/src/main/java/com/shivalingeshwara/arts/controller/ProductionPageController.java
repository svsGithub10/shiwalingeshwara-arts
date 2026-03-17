package com.shivalingeshwara.arts.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProductionPageController {

    @GetMapping("/production")
    public String production(){
        return "production";
    }

    @GetMapping("/production/orders")
    public String productionOrders(){
        return "production/orders";
    }

    @GetMapping("/production/materials")
    public String productionMaterials(){
        return "production/materials";
    }

}
package com.shivalingeshwara.arts.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class NavigationController {

    @GetMapping("/wip")
    public String workInProgress(){
        return "wip";
    }
}
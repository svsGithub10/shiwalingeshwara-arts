package com.shivalingeshwara.arts.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.repository.OrderRepository;



@RestController
@RequestMapping("/api/orders")
public class GalleryController {

    private final OrderRepository orderRepository;

    public GalleryController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/gallery")
    public List<Map<String,Object>> getGallery(){

        List<Order> orders = orderRepository.findByStatusIn(
            java.util.Arrays.asList("COMPLETED","DELIVERED")
        );

        List<Map<String,Object>> res = new ArrayList<>();

        for(Order o : orders){

            if(o.getResultImage() == null) continue;

            Map<String,Object> map = new HashMap<>();

            map.put("id", o.getId());
            map.put("image", o.getResultImage());
            map.put("materials", o.getMaterials()); // 🔥 FIXED KEY
            map.put("bgColor", o.getBgColor());
            map.put("height", o.getHeight());
            map.put("price", o.getPrice());
            map.put("date", o.getCreatedAt());
            map.put("displayPrice", o.getDisplayPrice());
            
            res.add(map);
        }

        return res;
    }
}
    


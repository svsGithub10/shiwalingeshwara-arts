package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.repository.OrderRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/orders")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // List Orders
    @GetMapping
    public String listOrders(Model model) {
        model.addAttribute("orders", orderRepository.findAll());
        return "orders/list";
    }

    // Show Add Order Form
    @GetMapping("/new")
    public String showAddForm(Model model) {
        model.addAttribute("order", new Order());
        return "orders/add";
    }

    // Handle Form Submission
    @PostMapping
    public String saveOrder(@ModelAttribute Order order) {
        if (order.getBalance() == null) {
            order.setBalance(order.getPrice() - order.getAdvance());
        }
        orderRepository.save(order);
        return "redirect:/orders";
    }
}

package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Payment;
import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.repository.PaymentRepository;
import com.shivalingeshwara.arts.repository.OrderRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;


    // ADD PAYMENT
    @PostMapping
    public Payment addPayment(@RequestBody Map<String,String> req){

        Long orderId = Long.parseLong(req.get("orderId"));
        Double amount = Double.parseDouble(req.get("amount"));

        Payment p = new Payment();
        p.setOrderId(orderId);
        p.setAmount(amount);
        p.setPaymentType(req.get("type"));
        p.setPaidAt(java.time.LocalDateTime.now());

        paymentRepository.save(p);

        // update order advance
        Order order = orderRepository.findById(orderId).orElseThrow();

        double newAdvance =
                (order.getAdvancePaid() == null ? 0 : order.getAdvancePaid())
                + amount;

        order.setAdvancePaid(newAdvance);

        orderRepository.save(order);

        return p;
    }


    // GET PAYMENTS
    @GetMapping("/{orderId}")
    public List<Payment> getPayments(@PathVariable Long orderId){

        return paymentRepository.findByOrderId(orderId);

    }

}
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

        double totalPrice = order.getPrice() == null ? 0 : order.getPrice();

if(newAdvance >= totalPrice){
    order.setStatus("DELIVERED");
    order.setDeliveredAt(java.time.LocalDateTime.now());
}

        orderRepository.save(order);

        return p;
    }


    // GET PAYMENTS
    @GetMapping("/{orderId}")
    public List<Payment> getPayments(@PathVariable Long orderId){

        return paymentRepository.findByOrderId(orderId);

    }

    // GET PAYMENTS BY CLIENT
@GetMapping("/client/{clientId}")
public List<Payment> getPaymentsByClient(@PathVariable Long clientId){

    // 1. get all orders of client
    List<Order> orders = orderRepository.findByClientId(clientId);

    if(orders.isEmpty()){
        return new ArrayList<>();
    }

    // 2. extract orderIds
    List<Long> orderIds = new ArrayList<>();

    for(Order o : orders){
        orderIds.add(o.getId());
    }

    // 3. get payments
    return paymentRepository.findByOrderIdIn(orderIds);
}

@PostMapping("/bulk")
public List<Payment> bulkPayment(@RequestBody Map<String,Object> req){

    Long clientId = Long.parseLong(req.get("clientId").toString());
    Double amount = Double.parseDouble(req.get("amount").toString());
    String type = req.get("type").toString();

    // 1. Get all orders of client
    List<Order> orders = orderRepository.findByClientId(clientId);

    // 2. Filter only pending orders
    List<Order> pendingOrders = new ArrayList<>();

    for(Order o : orders){
        double paid = o.getAdvancePaid() == null ? 0 : o.getAdvancePaid();
        double balance = o.getPrice() - paid;

        if(balance > 0){
            pendingOrders.add(o);
        }
    }

    // 3. Sort (optional but good → oldest first)
    pendingOrders.sort(Comparator.comparing(Order::getCreatedAt));

    List<Payment> createdPayments = new ArrayList<>();

    double remaining = amount;

    for(Order o : pendingOrders){

        if(remaining <= 0) break;

        double paid = o.getAdvancePaid() == null ? 0 : o.getAdvancePaid();
        double balance = o.getPrice() - paid;

        double payAmount = Math.min(balance, remaining);

        // create payment
        Payment p = new Payment();
        p.setOrderId(o.getId());
        p.setAmount(payAmount);
        p.setPaymentType(type);
        p.setPaidAt(java.time.LocalDateTime.now());

        paymentRepository.save(p);
        createdPayments.add(p);

        // update order
double newPaid = paid + payAmount;

o.setAdvancePaid(newPaid);

// 🔥 AUTO DELIVER CHECK
double totalPrice = o.getPrice() == null ? 0 : o.getPrice();

if(newPaid >= totalPrice){
    o.setStatus("DELIVERED");
    o.setDeliveredAt(java.time.LocalDateTime.now());
}

orderRepository.save(o);

        remaining -= payAmount;
    }

    return createdPayments;
}

}
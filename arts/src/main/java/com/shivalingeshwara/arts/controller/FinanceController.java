package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.model.Payment;
import com.shivalingeshwara.arts.repository.OrderRepository;
import com.shivalingeshwara.arts.repository.PaymentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

@GetMapping("/summary")
public Map<String,Object> getSummary(@RequestParam(required = false) String date){

    Map<String,Object> res = new HashMap<>();

    List<Order> orders = orderRepository.findAll();
    List<Payment> payments = paymentRepository.findAll();

    long totalOrders = orders.size();

    long inProgress = orders.stream()
            .filter(o -> "IN_PROGRESS".equals(o.getStatus()))
            .count();

    long completed = orders.stream()
            .filter(o -> "COMPLETED".equals(o.getStatus()))
            .count();

    double totalRevenue = payments.stream()
            .mapToDouble(p -> p.getAmount() == null ? 0 : p.getAmount())
            .sum();

    // ✅ USE SELECTED DATE
    java.time.LocalDate selectedDate =
            (date != null) ? java.time.LocalDate.parse(date)
                           : java.time.LocalDate.now();

    double todayRevenue = payments.stream()
            .filter(p -> p.getPaidAt() != null &&
                    p.getPaidAt().toLocalDate().equals(selectedDate))
            .mapToDouble(p -> p.getAmount() == null ? 0 : p.getAmount())
            .sum();

    long todayOrders = orders.stream()
            .filter(o -> o.getCreatedAt() != null &&
                    o.getCreatedAt().toLocalDate().equals(selectedDate))
            .count();

    res.put("totalOrders", totalOrders);
    res.put("inProgress", inProgress);
    res.put("completed", completed);
    res.put("todayRevenue", todayRevenue);
    res.put("todayOrders", todayOrders);
    res.put("totalRevenue", totalRevenue);

    return res;
}

@GetMapping("/monthly")
public Map<String, Object> getMonthlyRevenue(){


    List<Payment> payments = paymentRepository.findAll();
    List<Order> orders = orderRepository.findAll();

    Map<String, Object> res = new LinkedHashMap<>();

    String[] months = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};

for(int i = 0; i < 12; i++){

    final int monthIndex = i; // ✅ final variable

    String key = months[i];

    double revenue = payments.stream()
            .filter(p -> p.getPaidAt() != null &&
                    p.getPaidAt().getMonthValue() == monthIndex + 1) // ✅ FIX
            .mapToDouble(p -> p.getAmount() == null ? 0 : p.getAmount())
            .sum();

    long count = orders.stream()
            .filter(o -> o.getCreatedAt() != null &&
                    o.getCreatedAt().getMonthValue() == monthIndex + 1) // ✅ FIX
            .count();

    Map<String,Object> m = new HashMap<>();
    m.put("revenue", revenue);
    m.put("orders", count);

    res.put(key, m);
}

    return res;
}

@GetMapping("/yearly")
public Map<Integer, Object> getYearlyRevenue(){

    List<Payment> payments = paymentRepository.findAll();
    List<Order> orders = orderRepository.findAll();

    Map<Integer, Object> res = new TreeMap<>();

    for(Payment p : payments){

        if(p.getPaidAt() == null) continue;

        int year = p.getPaidAt().getYear();

        res.putIfAbsent(year, new HashMap<>());

        Map<String,Object> data = (Map<String,Object>) res.get(year);

        double revenue = (double) data.getOrDefault("revenue", 0.0);
        data.put("revenue", revenue + (p.getAmount()==null?0:p.getAmount()));
    }

    for(Order o : orders){

        if(o.getCreatedAt() == null) continue;

        int year = o.getCreatedAt().getYear();

        res.putIfAbsent(year, new HashMap<>());

        Map<String,Object> data = (Map<String,Object>) res.get(year);

        int count = (int) data.getOrDefault("orders", 0);
        data.put("orders", count + 1);
    }

    return res;
}

@GetMapping("/daily")
public Map<String, Double> getDailyRevenue(){

    List<Payment> payments = paymentRepository.findAll();

    Map<String, Double> daily = new LinkedHashMap<>();

    // last 7 days
    for(int i = 6; i >= 0; i--){

        java.time.LocalDate date = java.time.LocalDate.now().minusDays(i);

        daily.put(date.toString(), 0.0);
    }

    for(Payment p : payments){

        if(p.getPaidAt() == null) continue;

        String key = p.getPaidAt().toLocalDate().toString();

        if(daily.containsKey(key)){
            daily.put(key, daily.get(key) + p.getAmount());
        }
    }

    return daily;
}
}
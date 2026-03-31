package com.shivalingeshwara.arts.controller;

import com.shivalingeshwara.arts.model.Expense;
import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.model.Payment;
import com.shivalingeshwara.arts.repository.ExpenseRepository;
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

    @Autowired
    private ExpenseRepository expenseRepository;

@GetMapping("/summary")
public Map<String,Object> getSummary(@RequestParam(required = false) String date){

    Map<String,Object> res = new HashMap<>();

    List<Order> orders = orderRepository.findAll();
    List<Payment> payments = paymentRepository.findAll();
    List<Expense> expenses = expenseRepository.findAll(); // ✅ NEW

    long totalOrders = orders.size();

    long inProgress = orders.stream()
            .filter(o -> "IN_PROGRESS".equals(o.getStatus()))
            .count();

    long completed = orders.stream()
            .filter(o -> "COMPLETED".equals(o.getStatus()))
            .count();

    long delivered = orders.stream()
        .filter(o -> "DELIVERED".equals(o.getStatus()))
        .count();

    double totalRevenue = payments.stream()
            .mapToDouble(p -> p.getAmount() == null ? 0 : p.getAmount())
            .sum();

    // ✅ DATE
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

    // =========================
    // 🔥 NEW: EXPENSES
    // =========================

    double totalExpenses = expenses.stream()
            .mapToDouble(e -> e.getAmount() == null ? 0 : e.getAmount())
            .sum();

    double todayExpenses = expenses.stream()
            .filter(e -> e.getDate() != null &&
                    e.getDate().equals(selectedDate))
            .mapToDouble(e -> e.getAmount() == null ? 0 : e.getAmount())
            .sum();

    // =========================
    // 🔥 PROFIT
    // =========================

    double totalProfit = totalRevenue - totalExpenses;
    double todayProfit = todayRevenue - todayExpenses;

    // =========================
    // RESPONSE
    // =========================

    res.put("totalOrders", totalOrders);
    res.put("inProgress", inProgress);
    res.put("completed", completed);
    res.put("delivered", delivered);

    res.put("todayRevenue", todayRevenue);
    res.put("todayOrders", todayOrders);

    res.put("totalRevenue", totalRevenue);

    // ✅ NEW FIELDS
    res.put("totalExpenses", totalExpenses);
    res.put("todayExpenses", todayExpenses);

    res.put("totalProfit", totalProfit);
    res.put("todayProfit", todayProfit);

    return res;
}

@GetMapping("/monthly")
public Map<String, Object> getMonthlyRevenue(){

    List<Payment> payments = paymentRepository.findAll();
    List<Order> orders = orderRepository.findAll();
    List<Expense> expenses = expenseRepository.findAll(); // ✅ NEW

    Map<String, Object> res = new LinkedHashMap<>();

    String[] months = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};

    for(int i = 0; i < 12; i++){

        final int monthIndex = i;
        String key = months[i];

        double revenue = payments.stream()
                .filter(p -> p.getPaidAt() != null &&
                        p.getPaidAt().getMonthValue() == monthIndex + 1)
                .mapToDouble(p -> p.getAmount() == null ? 0 : p.getAmount())
                .sum();

        double expense = expenses.stream()
                .filter(e -> e.getDate() != null &&
                        e.getDate().getMonthValue() == monthIndex + 1)
                .mapToDouble(e -> e.getAmount() == null ? 0 : e.getAmount())
                .sum();

        long count = orders.stream()
                .filter(o -> o.getCreatedAt() != null &&
                        o.getCreatedAt().getMonthValue() == monthIndex + 1)
                .count();

        Map<String,Object> m = new HashMap<>();
        m.put("revenue", revenue);
        m.put("expenses", expense); // ✅ NEW
        m.put("profit", revenue - expense); // ✅ NEW
        m.put("orders", count);

        res.put(key, m);
    }

    return res;
}

@GetMapping("/yearly")
public Map<Integer, Object> getYearlyRevenue(){

    List<Payment> payments = paymentRepository.findAll();
    List<Order> orders = orderRepository.findAll();
    List<Expense> expenses = expenseRepository.findAll(); // ✅ NEW

    Map<Integer, Object> res = new TreeMap<>();

    // Revenue
    for(Payment p : payments){
        if(p.getPaidAt() == null) continue;

        int year = p.getPaidAt().getYear();

        res.putIfAbsent(year, new HashMap<>());
        Map<String,Object> data = (Map<String,Object>) res.get(year);

        double revenue = (double) data.getOrDefault("revenue", 0.0);
        data.put("revenue", revenue + (p.getAmount()==null?0:p.getAmount()));
    }

    // Expenses
    for(Expense e : expenses){
        if(e.getDate() == null) continue;

        int year = e.getDate().getYear();

        res.putIfAbsent(year, new HashMap<>());
        Map<String,Object> data = (Map<String,Object>) res.get(year);

        double exp = (double) data.getOrDefault("expenses", 0.0);
        data.put("expenses", exp + (e.getAmount()==null?0:e.getAmount()));
    }

    // Orders
    for(Order o : orders){
        if(o.getCreatedAt() == null) continue;

        int year = o.getCreatedAt().getYear();

        res.putIfAbsent(year, new HashMap<>());
        Map<String,Object> data = (Map<String,Object>) res.get(year);

        int count = (int) data.getOrDefault("orders", 0);
        data.put("orders", count + 1);
    }

    // Profit
    for(Object val : res.values()){
        Map<String,Object> d = (Map<String,Object>) val;

        double rev = (double) d.getOrDefault("revenue", 0.0);
        double exp = (double) d.getOrDefault("expenses", 0.0);

        d.put("profit", rev - exp);
    }

    return res;
}

@GetMapping("/daily-full")
public Map<String, Object> getDailyFull(){

    List<Payment> payments = paymentRepository.findAll();
    List<Expense> expenses = expenseRepository.findAll();

    Map<String, Object> daily = new LinkedHashMap<>();

    // last 7 days
    for(int i = 6; i >= 0; i--){

        java.time.LocalDate date = java.time.LocalDate.now().minusDays(i);

        Map<String, Object> d = new HashMap<>();
        d.put("revenue", 0.0);
        d.put("expenses", 0.0);

        daily.put(date.toString(), d);
    }

    // revenue
    for(Payment p : payments){

        if(p.getPaidAt() == null) continue;

        String key = p.getPaidAt().toLocalDate().toString();

        if(daily.containsKey(key)){
            Map<String,Object> d = (Map<String,Object>) daily.get(key);
            double rev = (double) d.get("revenue");
            d.put("revenue", rev + (p.getAmount()==null?0:p.getAmount()));
        }
    }

    // expenses
    for(Expense e : expenses){

        if(e.getDate() == null) continue;

        String key = e.getDate().toString();

        if(daily.containsKey(key)){
            Map<String,Object> d = (Map<String,Object>) daily.get(key);
            double exp = (double) d.get("expenses");
            d.put("expenses", exp + (e.getAmount()==null?0:e.getAmount()));
        }
    }

    return daily;
}
}
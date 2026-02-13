package com.shivalingeshwara.arts.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.shivalingeshwara.arts.repository.OrderRepository;
import com.shivalingeshwara.arts.service.OrderService;

@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private OrderRepository orderRepository;



    @Autowired
    private OrderService orderService;




@GetMapping
public String dashboard(Model model) {
    // Example stats (replace with queries)
    model.addAttribute("pending", orderRepository.countByStatus("Pending"));
    model.addAttribute("inProgress", orderRepository.countByStatus("In Progress"));
    model.addAttribute("completed", orderRepository.countByStatus("Completed"));
    model.addAttribute("delivered", orderRepository.countByStatus("Delivered"));

    model.addAttribute("todayOrders", orderService.getTodayOrdersCount());
    model.addAttribute("todayReceived", orderService.getTodayAmountReceived());
    model.addAttribute("todayPending", orderService.getTodayPendingAmount());

    model.addAttribute("totalOrders", orderRepository.count());
    model.addAttribute("totalReceived", orderService.getTotalRevenueReceived());
    model.addAttribute("totalPending", orderService.getTotalPendingAmount());

    return "dashboard";
}

@GetMapping("/api/earnings")
@ResponseBody
public Map<String, Object> getEarningsByDate(@RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    Map<String, Object> data = new HashMap<>();
    data.put("orders", orderService.getOrdersCountByDate(date));
    data.put("received", orderService.getAmountReceivedByDate(date));
    data.put("pending", orderService.getPendingAmountByDate(date));
    return data;
}

@GetMapping("/api/earnings/month")
public ResponseEntity<Map<String, Object>> getMonthEarnings(
        @RequestParam int year,
        @RequestParam int month) {

    Map<String, Object> result = new HashMap<>();
    result.put("orders", orderService.getMonthOrdersCount(year, month));
    result.put("received", orderService.getMonthRevenueReceived(year, month));
    result.put("pending", orderService.getMonthPendingAmount(year, month));

    return ResponseEntity.ok(result);
}

@GetMapping("/api/earnings/year")
public ResponseEntity<Map<String, Object>> getYearEarnings(@RequestParam int year) {
    Map<String, Object> result = new HashMap<>();
    result.put("orders", orderService.getYearOrdersCount(year));
    result.put("received", orderService.getYearRevenueReceived(year));
    result.put("pending", orderService.getYearPendingAmount(year));
    return ResponseEntity.ok(result);
}

@GetMapping("/api/summary")
@ResponseBody
public Map<String, Object> getDashboardSummary() {

    Map<String, Object> map = new HashMap<>();

    // Status counts
    map.put("pending", orderRepository.countByStatus("Pending"));
    map.put("inProgress", orderRepository.countByStatus("In Progress"));
    map.put("completed", orderRepository.countByStatus("Completed"));
    map.put("delivered", orderRepository.countByStatus("Delivered"));

    // Gross totals
    map.put("totalOrders", orderRepository.count());
    map.put("totalReceived", orderService.getTotalRevenueReceived());
    map.put("totalPending", orderService.getTotalPendingAmount());

    return map;
}






}


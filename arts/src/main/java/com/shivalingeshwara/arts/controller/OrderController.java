package com.shivalingeshwara.arts.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.model.Payment;
import com.shivalingeshwara.arts.repository.OrderRepository;
import com.shivalingeshwara.arts.repository.PaymentRepository;

@Controller
@RequestMapping("/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public OrderController(OrderRepository orderRepository, PaymentRepository paymentRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
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

@PostMapping
public String saveOrder(@ModelAttribute Order order,
                        @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

    if (file != null && !file.isEmpty()) {
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("C:/shivalingeshwara-arts/uploads/");

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        order.setReferenceImage(fileName);
    }

    if (order.getPrice() != null && order.getAdvance() != null) {
        order.setBalance(order.getPrice() - order.getAdvance());
    }

    orderRepository.save(order);
    return "redirect:/orders";
}




@GetMapping("/edit/{id}")
public String editOrder(@PathVariable("id") Long id, Model model) {
    Order order = orderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Invalid order Id: " + id));
    model.addAttribute("order", order);
    return "orders/edit"; // must match folder + filename
}


@PostMapping("/update/{id}")
public String updateOrder(@PathVariable Long id,
                          @ModelAttribute Order order,
                          @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

    Order existing = orderRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Invalid order Id:" + id));

    // ✅ Handle file upload
    if (file != null && !file.isEmpty()) {
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("C:/shivalingeshwara-arts/uploads/");

        // create directory if not exists
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // copy file
        Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

        // update reference image path (only fileName, not full path, so URL works)
        existing.setReferenceImage(fileName);
    }

    // update other fields
    existing.setCustomerName(order.getCustomerName());
    existing.setContactInfo(order.getContactInfo());
    existing.setDescription(order.getDescription());
    existing.setPrice(order.getPrice());
    existing.setAdvance(order.getAdvance());
    existing.setDueDate(order.getDueDate());
    existing.setStatus(order.getStatus());

    // recalc balance
    if (existing.getPrice() != null && existing.getAdvance() != null) {
        existing.setBalance(existing.getPrice() - existing.getAdvance());
    }

    orderRepository.save(existing);
    return "redirect:/orders";
}

@PostMapping("/delete/{id}")
public String deleteOrder(@PathVariable("id") Long id) {
    Order order = orderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Invalid order Id: " + id));

    // ✅ Delete reference image if it exists
    if (order.getReferenceImage() != null) {
        String uploadDir = "C:/shivalingeshwara-arts/uploads/";
        File file = new File(uploadDir + order.getReferenceImage());
        if (file.exists()) {
            file.delete();
        }
    }

    // ✅ Delete all payments first
    paymentRepository.deleteAll(order.getPayments());

    // ✅ Delete order from DB
    orderRepository.delete(order);

    return "redirect:/orders";
}

@PostMapping("/update-status/{id}")
public String updateStatus(@PathVariable Long id) {
    Order order = orderRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Invalid order Id: " + id));

    // Status workflow
    switch (order.getStatus()) {
        case "Pending" -> order.setStatus("In Progress");
        case "In Progress" -> order.setStatus("Completed");
        case "Completed" -> order.setStatus("Delivered");
        default -> {
            }
    }

    orderRepository.save(order);
    return "redirect:/orders";
}

@PostMapping("/{id}/payments")
public String addPayment(@PathVariable Long id,
                         @RequestParam Double amount,
                         @RequestParam String method) {

    Order order = orderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Invalid order Id: " + id));

    // Save payment log
    Payment payment = Payment.builder()
            .order(order)
            .amount(amount)
            .method(method)
            .build();
    paymentRepository.save(payment);

    // Update balance in order
    if (order.getBalance() == null) {
        order.setBalance(order.getPrice() - order.getAdvance());
    }
    order.setBalance(order.getBalance() - amount);

    orderRepository.save(order);

    return "redirect:/orders"; // redirect to order details page
}

@GetMapping("/{id}/payments")
public String viewPayments(@PathVariable Long id, Model model) {
    List<Payment> payments = paymentRepository.findByOrderId(id);
    model.addAttribute("payments", payments);
    return "orders/payments"; // payments.html
}

    @GetMapping("/{id}/payments/json")
    @ResponseBody
    public Map<String, Object> getPaymentsJson(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invalid order ID: " + id));

        List<Payment> payments = paymentRepository.findByOrder(order);

        Map<String, Object> response = new HashMap<>();
        response.put("advance", order.getAdvance());
        response.put("payments", payments);
        return response;
    }






@GetMapping("/payments/all")
@ResponseBody
public List<Map<String, Object>> getPayments(
    @RequestParam(required = false) String id,
    @RequestParam(required = false) String name,
    @RequestParam(required = false) String method,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
) {
    List<Payment> payments = paymentRepository.findAll();

    return payments.stream()
        .filter(p -> id == null || String.valueOf(p.getId()).contains(id))
        .filter(p -> {
            if (name == null) return true;
            return p.getOrder() != null && 
                   p.getOrder().getCustomerName() != null &&
                   p.getOrder().getCustomerName().toLowerCase().contains(name.toLowerCase());
        })
        .filter(p -> method == null || (p.getMethod() != null && p.getMethod().equalsIgnoreCase(method)))
        .filter(p -> {
            if (date == null) return true;
            return p.getPaymentDate() != null && p.getPaymentDate().toLocalDate().equals(date);
        })
        .map(p -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", p.getId());
            dto.put("orderId", p.getOrder() != null ? p.getOrder().getId() : null);
            dto.put("customerName", p.getOrder() != null ? p.getOrder().getCustomerName() : null);
            dto.put("amount", p.getAmount());
            dto.put("method", p.getMethod());
            dto.put("paymentDate", p.getPaymentDate());
            return dto;
        })
        .collect(Collectors.toList());  // ✅ safer than .toList()
}







@GetMapping("/{id}/json")
@ResponseBody
public Order getOrderJson(@PathVariable Long id) {
    return orderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Invalid order ID: " + id));
}

@GetMapping("/search")
@ResponseBody
public List<Order> searchOrders(
        @RequestParam(required = false) Long id,
        @RequestParam(required = false) String customerName,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
) {
    List<Order> orders = orderRepository.findAll();

    return orders.stream()
            .filter(o -> id == null || o.getId().equals(id))
            .filter(o -> customerName == null || o.getCustomerName().toLowerCase().contains(customerName.toLowerCase()))
            .filter(o -> status == null || status.isEmpty() || o.getStatus().equalsIgnoreCase(status))
            .filter(o -> fromDate == null || !o.getDueDate().isBefore(fromDate))
            .filter(o -> toDate == null || !o.getDueDate().isAfter(toDate))
            .collect(Collectors.toList());
}

}



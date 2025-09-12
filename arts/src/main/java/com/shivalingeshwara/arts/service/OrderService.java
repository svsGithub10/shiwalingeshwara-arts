package com.shivalingeshwara.arts.service;


import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import org.springframework.stereotype.Service;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.repository.OrderRepository;
import com.shivalingeshwara.arts.repository.PaymentRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public OrderService(OrderRepository orderRepository, PaymentRepository paymentRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
    }

    // ✅ Today orders count
    public long getTodayOrdersCount() {
        LocalDate today = LocalDate.now();
        return orderRepository.countByCreatedAt(today);
    }

    // ✅ Today revenue received (advance + payments)
    public double getTodayAmountReceived() {
        LocalDate today = LocalDate.now();

        // Payments today
        Double payments = paymentRepository.sumPaymentsByDate(today);
        double paymentsTotal = payments != null ? payments : 0.0;

        // Advances from orders created today
        List<Order> todayOrders = orderRepository.findByCreatedAt(today);
        double advancesTotal = todayOrders.stream()
                                          .mapToDouble(o -> o.getAdvance() != null ? o.getAdvance() : 0.0)
                                          .sum();

        return paymentsTotal + advancesTotal;
    }

    public long getOrdersCountByDate(LocalDate date) {
    return orderRepository.countByCreatedAt(date);
}

public double getAmountReceivedByDate(LocalDate date) {
    // Payments
    Double payments = paymentRepository.sumPaymentsByDate(date);
    double paymentsTotal = payments != null ? payments : 0.0;

    // Advances from orders created on that date
    List<Order> orders = orderRepository.findByCreatedAt(date);
    double advancesTotal = orders.stream()
                                 .mapToDouble(o -> o.getAdvance() != null ? o.getAdvance() : 0.0)
                                 .sum();

    return paymentsTotal + advancesTotal;
}

public double getPendingAmountByDate(LocalDate date) {
    List<Order> orders = orderRepository.findByCreatedAt(date);
    return orders.stream().mapToDouble(Order::getBalance).sum();
}


    // ✅ Today pending amount
    public double getTodayPendingAmount() {
        LocalDate today = LocalDate.now();
        List<Order> todayOrders = orderRepository.findByCreatedAt(today);
        return todayOrders.stream()
                          .mapToDouble(Order::getBalance)
                          .sum();
    }

// ✅ Monthly orders count (for any year+month)
public long getMonthOrdersCount(int year, int month) {
    YearMonth ym = YearMonth.of(year, month);
    LocalDate start = ym.atDay(1);
    LocalDate end = ym.atEndOfMonth();
    return orderRepository.countByCreatedAtBetween(start, end);
}

// ✅ Monthly revenue received (advance + payments)
public double getMonthRevenueReceived(int year, int month) {
    YearMonth ym = YearMonth.of(year, month);
    LocalDate start = ym.atDay(1);
    LocalDate end = ym.atEndOfMonth();

    // Payments in this month
    Double payments = paymentRepository.sumPaymentsBetweenDates(
            start.atStartOfDay(), end.atTime(23,59,59));
    double paymentsTotal = payments != null ? payments : 0.0;

    // Advances from orders created in this month
    List<Order> monthOrders = orderRepository.findByCreatedAtBetween(start, end);
    double advancesTotal = monthOrders.stream()
                                      .mapToDouble(o -> o.getAdvance() != null ? o.getAdvance() : 0.0)
                                      .sum();

    return paymentsTotal + advancesTotal;
}

// ✅ Monthly pending
public double getMonthPendingAmount(int year, int month) {
    YearMonth ym = YearMonth.of(year, month);
    LocalDate start = ym.atDay(1);
    LocalDate end = ym.atEndOfMonth();
    List<Order> monthOrders = orderRepository.findByCreatedAtBetween(start, end);
    return monthOrders.stream()
                      .mapToDouble(Order::getBalance)
                      .sum();
}



    
// ✅ Yearly orders count (for any year)
public long getYearOrdersCount(int year) {
    LocalDate start = LocalDate.of(year, 1, 1);
    LocalDate end = LocalDate.of(year, 12, 31);
    return orderRepository.countByCreatedAtBetween(start, end);
}

// ✅ Yearly revenue received (advance + payments)
public double getYearRevenueReceived(int year) {
    LocalDate start = LocalDate.of(year, 1, 1);
    LocalDate end = LocalDate.of(year, 12, 31);

    // Payments this year
    Double payments = paymentRepository.sumPaymentsBetweenDates(
            start.atStartOfDay(), end.atTime(23,59,59));
    double paymentsTotal = payments != null ? payments : 0.0;

    // Advances from orders created this year
    List<Order> yearOrders = orderRepository.findByCreatedAtBetween(start, end);
    double advancesTotal = yearOrders.stream()
                                     .mapToDouble(o -> o.getAdvance() != null ? o.getAdvance() : 0.0)
                                     .sum();

    return paymentsTotal + advancesTotal;
}

// ✅ Yearly pending
public double getYearPendingAmount(int year) {
    LocalDate start = LocalDate.of(year, 1, 1);
    LocalDate end = LocalDate.of(year, 12, 31);
    List<Order> yearOrders = orderRepository.findByCreatedAtBetween(start, end);
    return yearOrders.stream()
                     .mapToDouble(Order::getBalance)
                     .sum();
}


    // ✅ Gross totals
    public double getTotalRevenueReceived() {
        // Payments (all time)
        Double payments = paymentRepository.sumAllPayments();
        double paymentsTotal = payments != null ? payments : 0.0;

        // Advances (all orders)
        double advancesTotal = orderRepository.findAll().stream()
                                              .mapToDouble(o -> o.getAdvance() != null ? o.getAdvance() : 0.0)
                                              .sum();

        return paymentsTotal + advancesTotal;
    }

    public double getTotalPendingAmount() {
        return orderRepository.findAll().stream()
                              .mapToDouble(Order::getBalance)
                              .sum();
    }
}



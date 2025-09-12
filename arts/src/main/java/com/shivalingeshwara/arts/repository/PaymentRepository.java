package com.shivalingeshwara.arts.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shivalingeshwara.arts.model.Order;
import com.shivalingeshwara.arts.model.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrderId(Long orderId);
    List<Payment> findByOrder(Order order);

    @Query("SELECT SUM(p.amount) FROM Payment p")
    Double sumAllPayments();

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE DATE(p.paymentDate) = :date")
    Double sumPaymentsByDate(@Param("date") LocalDate date);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentDate BETWEEN :start AND :end")
    Double sumPaymentsBetweenDates(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);



}

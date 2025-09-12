package com.shivalingeshwara.arts.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.shivalingeshwara.arts.model.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    long countByStatus(String status);

    @Query("SELECT SUM(o.advance) FROM Order o")
    Double sumAdvance();

    @Query("SELECT SUM(o.balance) FROM Order o")
    Double sumBalance();

    long countByCreatedAt(LocalDate date);
    long countByCreatedAtBetween(LocalDate start, LocalDate end);
    List<Order> findByCreatedAt(LocalDate date);
    List<Order> findByCreatedAtBetween(LocalDate start, LocalDate end);

}

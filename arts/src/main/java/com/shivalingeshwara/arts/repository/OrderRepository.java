package com.shivalingeshwara.arts.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shivalingeshwara.arts.model.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
}

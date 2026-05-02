package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByClientId(Long clientId);
    List<Order> findByStatusIn(List<String> status);
    

}
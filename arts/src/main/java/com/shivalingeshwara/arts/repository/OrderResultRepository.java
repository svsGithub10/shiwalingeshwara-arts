package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.OrderResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderResultRepository extends JpaRepository<OrderResult, Long> {

    List<OrderResult> findByOrderItemId(Long orderItemId);

}
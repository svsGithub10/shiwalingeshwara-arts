package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment,Long>{

    List<Payment> findByOrderId(Long orderId);

    void deleteByOrderId(Long orderId);

}
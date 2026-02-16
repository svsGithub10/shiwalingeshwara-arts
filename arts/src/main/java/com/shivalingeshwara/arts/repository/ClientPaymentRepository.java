package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.ClientPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ClientPaymentRepository extends JpaRepository<ClientPayment, Long> {

    List<ClientPayment> findByClientIdOrderByPaymentDateDesc(Long clientId);

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM ClientPayment p WHERE p.client.id = :clientId")
    Double getTotalPaidByClient(Long clientId);

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM ClientPayment p")
    Double getTotalPaid();

    @Query("""
    SELECT COALESCE(SUM(p.amount),0)
    FROM ClientPayment p
    WHERE p.paymentDate BETWEEN :start AND :end
""")
Double sumPaymentsBetween(LocalDateTime start, LocalDateTime end);

}

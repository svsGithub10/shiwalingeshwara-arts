package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.ClientOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ClientOrderRepository extends JpaRepository<ClientOrder, Long> {

    List<ClientOrder> findByClientId(Long clientId);

    @Query("SELECT COALESCE(SUM(o.price),0) FROM ClientOrder o WHERE o.client.id = :clientId")
    Double getTotalBilledByClient(Long clientId);

    long countByClientId(Long clientId);

    boolean existsByClientId(Long clientId);

}

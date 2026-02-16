package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, Long> {

    long countByActiveTrue();
long countByActiveFalse();
long countByTotalBalanceGreaterThan(Double amount);


}

package com.shivalingeshwara.arts.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shivalingeshwara.arts.model.DeviceSession;

public interface DeviceSessionRepository extends JpaRepository<DeviceSession, Long>{
    
    DeviceSession findByToken(String token);

}

package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    List<User> findByRole(String role);

    List<User> findByNameContainingIgnoreCaseAndRole(String name, String role);

}
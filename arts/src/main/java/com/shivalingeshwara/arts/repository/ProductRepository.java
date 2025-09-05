package com.shivalingeshwara.arts.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shivalingeshwara.arts.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
}

package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByCategory(String category);

}
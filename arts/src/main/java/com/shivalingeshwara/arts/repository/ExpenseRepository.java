package com.shivalingeshwara.arts.repository;

import com.shivalingeshwara.arts.model.Expense;
import com.shivalingeshwara.arts.model.ExpenseType;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByType(ExpenseType type);
}
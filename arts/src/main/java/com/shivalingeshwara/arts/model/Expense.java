package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name="expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category;

    private String description;

    private double amount;

    private LocalDate expenseDate;

    private String billFile;

    public Expense(){}

    public Long getId(){ return id; }
    public String getCategory(){ return category; }
    public String getDescription(){ return description; }
    public double getAmount(){ return amount; }
    public LocalDate getExpenseDate(){ return expenseDate; }
    public String getBillFile(){ return billFile; }

    public void setId(Long id){ this.id=id; }
    public void setCategory(String category){ this.category=category; }
    public void setDescription(String description){ this.description=description; }
    public void setAmount(double amount){ this.amount=amount; }
    public void setExpenseDate(LocalDate expenseDate){ this.expenseDate=expenseDate; }
    public void setBillFile(String billFile){ this.billFile=billFile; }
}
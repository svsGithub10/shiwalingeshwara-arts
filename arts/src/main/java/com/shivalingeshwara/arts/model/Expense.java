package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Enumerated(EnumType.STRING)
    private ExpenseType type;   // MATERIAL | BILL | PIGMY

    private String category;

    private Double amount;

    private LocalDate date;

    @Column(length = 1000)
    private String note;

    private String fileUrl;   // 👈 bill / material invoice

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public ExpenseType getType() { return type; }
    public void setType(ExpenseType type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
}
package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "client_orders")
public class ClientOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    private String description;

    private Double price;

    private LocalDate orderedDate;

    private LocalDate dueDate;

    private String status; // Pending, In Progress, Completed, Delivered

    // ===== Constructors =====
    public ClientOrder() {}

    // ===== Getters & Setters =====
    public Long getId() { return id; }

    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }

    public String getDescription() { return description; }
    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() { return price; }
    public void setPrice(Double price) {
        this.price = price;
    }

    public LocalDate getOrderedDate() { return orderedDate; }
    public void setOrderedDate(LocalDate orderedDate) {
        this.orderedDate = orderedDate;
    }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) {
        this.status = status;
    }
}

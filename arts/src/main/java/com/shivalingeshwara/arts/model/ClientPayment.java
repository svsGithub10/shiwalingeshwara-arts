package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "client_payments")
public class ClientPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_id", nullable = false)
@JsonIgnore
private Client client;

    private Double amount;

    private String method; // Cash / UPI

    private LocalDateTime paymentDate;

    // ===== Constructors =====
    public ClientPayment() {}

    // ===== Getters & Setters =====
    public Long getId() { return id; }

    public Client getClient() { return client; }
    public void setClient(Client client) {
        this.client = client;
    }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getMethod() { return method; }
    public void setMethod(String method) {
        this.method = method;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }
}

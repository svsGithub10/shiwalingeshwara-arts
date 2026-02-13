package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String phone;

    private Double totalBalance = 0.0;

    private boolean active = true;

    // ===== Constructors =====
    public Client() {}

    public Client(String name, String phone) {
        this.name = name;
        this.phone = phone;
        this.totalBalance = 0.0;
        this.active = true;
    }

    // ===== Getters & Setters =====
    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Double getTotalBalance() { return totalBalance; }
    public void setTotalBalance(Double totalBalance) {
        this.totalBalance = totalBalance;
    }

    public boolean isActive() { return active; }
    public void setActive(boolean active) {
        this.active = active;
    }
}

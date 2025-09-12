package com.shivalingeshwara.arts.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private String contactInfo;

    @Column(length = 1000)
    private String description;

    private Double price;
    private Double advance;
    private Double balance;

    private LocalDate createdAt;
    private LocalDate dueDate;

    private String status; // Pending / In Progress / Completed / Delivered

    // ✅ New field: reference image (nullable)
    private String referenceImage;

    // ✅ Link to payments (with cascade + orphan removal)
    @Builder.Default
// Order.java
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
@JsonManagedReference
private List<Payment> payments = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDate.now();
        if (this.balance == null && this.price != null && this.advance != null) {
            this.balance = this.price - this.advance;
        }
        if (this.status == null) {
            this.status = "Pending";
        }
    }
}

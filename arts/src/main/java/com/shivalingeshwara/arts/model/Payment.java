package com.shivalingeshwara.arts.model;

import jakarta.persistence.*;

@Entity
@Table(name="payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="order_id")
    private Long orderId;

    private Double amount;

    @Column(name="payment_type")
    private String paymentType;

    @Column(name="paid_at")
    private String paidAt;

    public Payment(){}

    public Long getId(){ return id; }
    public Long getOrderId(){ return orderId; }
    public Double getAmount(){ return amount; }
    public String getPaymentType(){ return paymentType; }

    public void setId(Long id){ this.id=id; }
    public void setOrderId(Long orderId){ this.orderId=orderId; }
    public void setAmount(Double amount){ this.amount=amount; }
    public void setPaymentType(String paymentType){ this.paymentType=paymentType; }
}